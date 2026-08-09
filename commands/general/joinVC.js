import { log } from '../../utils/functions.js';

export default {
    name: 'joinvc',
    description: 'Joins a specified voice channel.',
    aliases: ['vc', 'connectvc'],
    usage: '<channel_url/channel_id>',
    category: 'general',
    type: 'server_only',
    permissions: ['SendMessages'],
    cooldown: 5,

    /**
     * Execute the joinvc command
     * @param {Client} client - Discord.js client instance
     * @param {Message} message - The message object
     * @param {Array} args - Command arguments
     */
    execute: async (client, message, args) => {
        if (!message.guild) {
            return message.channel.send('> ❌ **Error:** This command can only be used in a server.');
        }

        const channelIdentifier = args[0];
        if (!channelIdentifier) {
            return message.channel.send('> ❌ **Error:** Please provide a channel URL or ID.');
        }

        let channelId;
        // Attempt to parse channel ID from URL
        const urlMatch = channelIdentifier.match(/discord\.com\/channels\/\d+\/(\d+)/);
        if (urlMatch && urlMatch[1]) {
            channelId = urlMatch[1];
        } else if (channelIdentifier.match(/^\d+$/)) {
            // Assume it's a direct ID if it's all digits
            channelId = channelIdentifier;
        } else {
            return message.channel.send('> ❌ **Error:** Invalid channel URL or ID provided.');
        }

        try {
            const channel = await client.channels.fetch(channelId);

            if (!channel) {
                return message.channel.send('> ❌ **Error:** Could not find a channel with that ID.');
            }

            if (channel.type !== 'GUILD_VOICE' && channel.type !== 'GUILD_STAGE_VOICE') {
                return message.channel.send('> ❌ **Error:** The provided ID/URL does not belong to a voice or stage channel.');
            }

            // Check permissions
            const permissions = channel.permissionsFor(client.user);
            if (!permissions.has('VIEW_CHANNEL')) {
                return message.channel.send('> ❌ **Error:** I do not have permission to view that voice channel.');
            }
            if (!permissions.has('CONNECT')) {
                return message.channel.send('> ❌ **Error:** I do not have permission to connect to that voice channel.');
            }
            if (!permissions.has('SPEAK')) {
                return message.channel.send('> ❌ **Error:** I do not have permission to speak in that voice channel.');
            }

            // Check if the selfbot has permissions to manage its own mute/deafen state if configured to do so
            const vcConfig = client.config.vc_command;
            if (vcConfig.mute && !permissions.has('MUTE_MEMBERS')) {
                // If configured to mute but lacks MUTE_MEMBERS, it might be server-muted
                log('Warning: Configured to mute but missing MUTE_MEMBERS permission. May not be able to unmute if server-muted.', 'warn');
            }
            if (vcConfig.deafen && !permissions.has('DEAFEN_MEMBERS')) {
                // If configured to deafen but lacks DEAFEN_MEMBERS, it might be server-deafened
                log('Warning: Configured to deafen but missing DEAFEN_MEMBERS permission. May not be able to undeafen if server-deafened.', 'warn');
            }

            // Attempt to join the voice channel by directly updating the client's voice state
            // This is a low-level approach for selfbots to initiate a voice connection.
            if (client.ws.shards.first()) {
                client.ws.shards.first().send({
                    op: 4,
                    d: {
                        guild_id: message.guild.id,
                        channel_id: channel.id,
                        self_mute: client.config.vc_command.mute,
                        self_deaf: client.config.vc_command.deafen,
                    },
                });
                log(`Attempting to join voice channel: ${channel.name} (${channel.id}) in ${message.guild.name} via WebSocket`, 'debug');
                message.channel.send(formatAnsiBlock([
                    `✅ ${style('Attempting to join voice channel:', '1;30')} \`${channel.name}\``
                ]));

                // Store last joined voice channel for auto-reconnect
                client.lastJoinedVoiceChannel = {
                    guildId: message.guild.id,
                    channelId: channel.id,
                    mute: client.config.vc_command.mute,
                    deafen: client.config.vc_command.deafen,
                    attempts: 0 // Initialize reconnection attempts
                };

                // After a short delay, check the actual voice state for mute/deafen status
                setTimeout(async () => {
                    const memberVoiceState = message.guild.members.cache.get(client.user.id)?.voice;
                    if (memberVoiceState) {
                        let statusMessage = '';
                        if (vcConfig.mute && memberVoiceState.selfMute) {
                            statusMessage += ' (Self-muted)';
                        } else if (vcConfig.mute && !memberVoiceState.selfMute) {
                            statusMessage += ' (Failed to self-mute: Server-muted or missing permissions)';
                        }

                        if (vcConfig.deafen && memberVoiceState.selfDeaf) {
                            statusMessage += ' (Self-deafened)';
                        } else if (vcConfig.deafen && !memberVoiceState.selfDeaf) {
                            statusMessage += ' (Failed to self-deafen: Server-deafened or missing permissions)';
                        }
                        if (statusMessage) {
                            message.channel.send(`> ℹ️ **Voice State Update:** ${statusMessage.trim()}`);
                        }
                    }
                }, 2000); // Wait 2 seconds for voice state to update
            } else {
                return message.channel.send('> ❌ **Error:** Could not access WebSocket shard to join voice channel.');
            }

        } catch (error) {
            log(`Error joining voice channel: ${error.message}`, 'error');
            return message.channel.send(`> ❌ **Error:** An error occurred while trying to join the voice channel: ${error.message}`);
        }
    },
};

function style(text, colorCode) {
    return `\u001b[${colorCode}m${text}\u001b[0m`;
}

function formatAnsiBlock(lines) {
    return ['> ```ansi', ...lines.map(line => `> ${line}`), '> ```'].join('\n');
}
