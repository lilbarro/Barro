import { log } from '../../utils/functions.js';

export default {
    name: 'lock',
    description: 'Lock the channel to prevent sending messages.',
    aliases: ['lockdown', 'lockcategory'],
    usage: '[reason]',
    category: 'moderation',
    type: 'server_only',
    permissions: ['ManageChannels'],
    cooldown: 5,

    execute: async (client, message, args) => {
        const reason = args.join(' ') || 'No reason provided';

        // Check if the channel is already locked
        const everyoneRole = message.guild.roles.everyone;
        const permissions = message.channel.permissionOverwrites.cache.get(everyoneRole.id) || {};
        if (permissions.SendMessages === false) {
            return message.channel.send('> ℹ️ This channel is already locked.');
        }

        try {
            // Update permissions for the default (@everyone) role
            await message.channel.permissionOverwrites.edit(everyoneRole, {
                SendMessages: false,
            }, { reason: `${reason} | Locked by ${message.author.tag}` });

            let response = `> 🔒 Locked this channel`;
            if (reason) {
                response += `\n> ℹ️ Reason: ${reason}`;
            }

            message.channel.send(response);
        } catch (error) {
            log(`Failed to lock channel: ${error.message}`, 'error');
            message.channel.send(`> ❌ Failed to lock the channel: ${error.message}`);
        }
    },
};