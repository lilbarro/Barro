import { log } from '../../utils/functions.js';

export default {
    name: 'nukecurrent',
    description: 'Recreate a channel to completely clear it.',
    aliases: ['recreate', 'nukechannel'],
    usage: '[channel]',
    category: 'moderation',
    type: 'server_only',
    permissions: ['ManageChannels'],
    cooldown: 10,

    execute: async (client, message, args) => {
        let channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]) || message.channel;

        try {
            // Clone the channel
            const newChannel = await channel.clone({ reason: `Nuked by ${message.author.tag}` });

            // Delete the old channel
            await channel.delete({ reason: `Nuked by ${message.author.tag}` });

            // Send confirmation in the new channel
            await newChannel.send(`> 💣 Channel nuked by ${message.author}`);
        } catch (error) {
            log(`Error nuking channel: ${error.message}`, 'error');
            message.channel.send(`> ❌ Failed to nuke channel: ${error.message}`);
        }
    },
};