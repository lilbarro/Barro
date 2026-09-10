import chalk from 'chalk';
import { log } from '../../utils/functions.js';
import { THEME } from '../../utils/theme.js';

export default {
    name: 'serverinfo',
    description: 'Display detailed server information',
    aliases: ['si', 'server'],
    usage: '',
    category: 'general',
    type: 'server_only',
    permissions: ['SendMessages'],
    cooldown: 30,

    /**
     * Execute the serverinfo command
     * @param {Client} client - Discord.js client instance
     * @param {Message} message - The message object
     * @param {Array} args - Command arguments
     */
    execute: async (client, message, args) => {
        if (args[0] && ['help', '--help', '-h'].includes(args[0].toLowerCase())) {
            return message.channel.send(`> **ServerInfo Help**\n> Usage: \`${client.prefix}serverinfo\`\n> Aliases: ${client.prefix}si, ${client.prefix}server`);
        }
        const guild = message.guild;

        try {
            let ownerDisplay = 'Unknown Owner';
            try {
                // Add null check for ownerId
                if (guild.ownerId) {
                    const owner = await client.users.fetch(guild.ownerId).catch(() => null);
                    if (owner?.tag) {
                        ownerDisplay = owner.tag;
                    } else {
                        ownerDisplay = `ID: ${guild.ownerId} (Uncached User)`;
                    }
                }
            } catch (fetchError) {
                log(`Could not fetch owner for guild ${guild?.name || 'Unknown'} (${guild?.id || 'Unknown ID'}). Error: ${fetchError.message}`, 'warn');
                ownerDisplay = guild?.ownerId ? `ID: ${guild.ownerId} (Couldn't fetch tag)` : 'Unknown Owner';
            }

            const verificationLevels = {
                NONE: 'None',
                LOW: 'Low',
                MEDIUM: 'Medium',
                HIGH: 'High',
                VERY_HIGH: 'Very High'
            };

            const features = Array.isArray(guild.features) ? 
                guild.features.map(feature => 
                    feature.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')
                ).join(', ') : 'None';

            const serverInfoMessage = formatAnsiBlock([
                style(`Server Information for ${guild?.name || 'Unknown Server'}`, THEME.HEADER_BOLD_COLOR),
                '',
                `${style('Owner:', THEME.LABEL_COLOR)} ${style(ownerDisplay, THEME.ACCENT_COLOR)}`,
                `${style('Server ID:', THEME.LABEL_COLOR)} ${style(guild?.id || 'Unknown', THEME.ACCENT_COLOR)}`,
                `${style('Created On:', THEME.LABEL_COLOR)} ${style(guild?.createdAt ? guild.createdAt.toUTCString() : 'Unknown', THEME.ACCENT_COLOR)}`,
                '',
                `${style('Members:', THEME.LABEL_COLOR)} ${style(guild?.memberCount || 0, THEME.ACCENT_COLOR)}`,
                `${style('Channels:', THEME.LABEL_COLOR)} ${style(guild?.channels?.cache?.size || 0, THEME.ACCENT_COLOR)} total`,
                `  - ${style('Text:', THEME.LABEL_COLOR)} ${style(guild?.channels?.cache?.filter(c => c?.type === 'GUILD_TEXT')?.size || 0, THEME.ACCENT_COLOR)}`,
                `  - ${style('Voice:', THEME.LABEL_COLOR)} ${style(guild?.channels?.cache?.filter(c => c?.type === 'GUILD_VOICE')?.size || 0, THEME.ACCENT_COLOR)}`,
                `  - ${style('Categories:', THEME.LABEL_COLOR)} ${style(guild?.channels?.cache?.filter(c => c?.type === 'GUILD_CATEGORY')?.size || 0, THEME.ACCENT_COLOR)}`,
                `${style('Roles:', THEME.LABEL_COLOR)} ${style(guild?.roles?.cache?.size || 0, THEME.ACCENT_COLOR)}`,
                '',
                `${style('Boost Tier:', THEME.LABEL_COLOR)} ${style(guild?.premiumTier || 'None', THEME.ACCENT_COLOR)}`,
                `${style('Boosts:', THEME.LABEL_COLOR)} ${style(guild?.premiumSubscriptionCount || 0, THEME.ACCENT_COLOR)}`,
                `${style('Verification Level:', THEME.LABEL_COLOR)} ${style(verificationLevels[guild?.verificationLevel] || 'Unknown', THEME.ACCENT_COLOR)}`,
                `${style('Features:', THEME.LABEL_COLOR)} ${style(features, THEME.ACCENT_COLOR)}`
            ]);

            await message.channel.send(serverInfoMessage).catch(err => {
                log(`Failed to send server info message: ${err.message}`, 'error');
                return message?.channel?.send('> ❌ **Error:** Failed to send server information.');
            });

            log(`${message?.author?.tag || 'Unknown User'} requested server info for "${guild?.name || 'Unknown Server'}"`, 'info');

        } catch (error) {
            console.error(chalk.red(`[ERROR] Error in serverinfo command for guild ${guild?.id || 'Unknown'}:`), error);
            return message?.channel?.send('> ❌ **Error:** An error occurred while fetching server information.').catch(() => {});
        }
    }
};

function style(text, colorCode) {
    return `\u001b[${colorCode}m${text}\u001b[0m`;
}

function formatAnsiBlock(lines) {
    return ['> ```ansi', ...lines.map(line => `> ${line}`), '> ```'].join('\n');
}
