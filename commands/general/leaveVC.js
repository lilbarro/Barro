import { log } from '../../utils/functions.js';

export default {
    name: 'leavevc',
    description: 'Leaves the current voice channel.',
    aliases: ['disconnectvc', 'dc'],
    usage: '[channel_id/channel_url]', // Optional: if specified, only leave that specific channel
    category: 'general',
    type: 'server_only',
    permissions: ['SendMessages'],
    cooldown: 5,

    /**
     * Execute the leavevc command
     * @param {Client} client - Discord.js client instance
     * @param {Message} message - The message object
     * @param {Array} args - Command arguments
     */
    execute: async (client, message, args) => {
        if (!message.guild) {
            return message.channel.send('> ❌ **Error:** This command can only be used in a server.');
        }

        const currentVoiceState = message.guild.members.cache.get(client.user.id)?.voice;

        if (!currentVoiceState || !currentVoiceState.channelId) {
            return message.channel.send('> ❌ **Error:** I am not currently in a voice channel in this server.');
        }

        let targetChannelId = null;
        if (args[0]) {
            // Attempt to parse channel ID from URL or direct ID
            const urlMatch = args[0].match(/discord\.com\/channels\/\d+\/(\d+)/);
            if (urlMatch && urlMatch[1]) {
                targetChannelId = urlMatch[1];
            } else if (args[0].match(/^\d+$/)) {
                targetChannelId = args[0];
            } else {
                return message.channel.send('> ❌ **Error:** Invalid channel URL or ID provided. Please provide a valid ID or URL, or no argument to leave the current channel.');
            }

            if (currentVoiceState.channelId !== targetChannelId) {
                return message.channel.send(`> ❌ **Error:** I am not currently in the specified voice channel (\`${targetChannelId}\`). I am in \`${currentVoiceState.channel?.name || currentVoiceState.channelId}\`.`);
            }
        }

        try {
            // Send WebSocket opcode 4 to disconnect from the voice channel
            if (client.ws.shards.first()) {
                client.ws.shards.first().send({
                    op: 4,
                    d: {
                        guild_id: message.guild.id,
                        channel_id: null, // Set channel_id to null to disconnect
                        self_mute: false, // Reset mute/deafen state on disconnect
                        self_deaf: false,
                    },
                });
                log(`Left voice channel: ${currentVoiceState.channel?.name || currentVoiceState.channelId} in ${message.guild.name} via WebSocket`, 'debug');
                message.channel.send(`> ✅ **Successfully left voice channel:** \`${currentVoiceState.channel?.name || currentVoiceState.channelId}\``);

                // Clear last joined voice channel for auto-reconnect
                if (client.lastJoinedVoiceChannel && client.lastJoinedVoiceChannel.channelId === currentVoiceState.channelId) {
                    client.lastJoinedVoiceChannel = null;
                    log('Cleared last joined voice channel for auto-reconnect.', 'debug');
                }
            } else {
                return message.channel.send('> ❌ **Error:** Could not access WebSocket shard to leave voice channel.');
            }

        } catch (error) {
            log(`Error leaving voice channel: ${error.message}`, 'error');
            return message.channel.send(`> ❌ **Error:** An error occurred while trying to leave the voice channel: ${error.message}`);
        }
    },
};