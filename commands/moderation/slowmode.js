import { log } from '../../utils/functions.js';

export default {
    name: 'slowmode',
    description: 'Set slowmode delay for the channel.',
    aliases: ['slow', 'cooldown', 'ratelimit'],
    usage: '<seconds>',
    category: 'moderation',
    type: 'server_only',
    permissions: ['ManageChannels'],
    cooldown: 5,

    execute: async (client, message, args) => {
        const seconds = parseInt(args[0]);

        // Check current slowmode
        const currentSlowmode = message.channel.rateLimitPerUser;

        // If no seconds provided, show current slowmode
        if (!args[0]) {
            return message.channel.send(`> ℹ️ Current slowmode is ${currentSlowmode}s`);
        }

        // Validate input
        if (isNaN(seconds)) {
            return message.channel.send(`> ❌ Please provide a valid number of seconds.`);
        }

        if (seconds > 21600) {
            return message.channel.send(`> ❌ Slowmode cannot exceed 6 hours (21600 seconds).`);
        }

        // Check if the requested slowmode matches the current setting
        if (seconds === currentSlowmode) {
            return message.channel.send(`> ℹ️ Slowmode is already set to ${seconds}s.`);
        }

        try {
            await message.channel.setRateLimitPerUser(seconds);

            if (seconds === 0) {
                message.channel.send(`> ✅ Slowmode disabled.`);
            } else {
                message.channel.send(`> 🐌 Set slowmode delay to ${seconds}s.`);
            }
        } catch (error) {
            log(`Error setting slowmode: ${error.message}`, 'error');
            message.channel.send(`> ❌ Failed to set slowmode: ${error.message}`);
        }
    },
};