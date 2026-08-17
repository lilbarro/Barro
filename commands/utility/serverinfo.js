import chalk from 'chalk';
import { log } from '../../utils/functions.js';

export default {
    name: 'serverinfo',
    description: 'Fetches and displays detailed information about the server.',
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
                style(`Server Information for ${guild?.name || 'Unknown Server'}`, '1;30'),
                '',
                `${style('Owner:', '1;31')} ${ownerDisplay}`,
                `${style('Server ID:', '1;31')} ${guild?.id || 'Unknown'}`,
                `${style('Created On:', '1;31')} ${guild?.createdAt ? guild.createdAt.toUTCString() : 'Unknown'}`,
                '',
                `${style('Members:', '1;31')} ${guild?.memberCount || 0}`,
                `${style('Channels:', '1;31')} ${guild?.channels?.cache?.size || 0} total`,
                `  - ${style('Text:', '1;31')} ${guild?.channels?.cache?.filter(c => c?.type === 'GUILD_TEXT')?.size || 0}`,
                `  - ${style('Voice:', '1;31')} ${guild?.channels?.cache?.filter(c => c?.type === 'GUILD_VOICE')?.size || 0}`,
                `  - ${style('Categories:', '1;31')} ${guild?.channels?.cache?.filter(c => c?.type === 'GUILD_CATEGORY')?.size || 0}`,
                `${style('Roles:', '1;31')} ${guild?.roles?.cache?.size || 0}`,
                '',
                `${style('Boost Tier:', '1;31')} ${guild?.premiumTier || 'None'}`,
                `${style('Boosts:', '1;31')} ${guild?.premiumSubscriptionCount || 0}`,
                `${style('Verification Level:', '1;31')} ${verificationLevels[guild?.verificationLevel] || 'Unknown'}`,
                `${style('Features:', '1;31')} ${features}`
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
