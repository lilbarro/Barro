import { log } from '../../utils/functions.js';

export default {
  name: "deletechannel",
  description: "Delete a channel",
  aliases: ["dchannel", "removechannel"],
  usage: 'deletechannel <channel_mention/ID>',
  category: 'server',
  type: 'server_only',
  permissions: ['ManageChannels'],
  cooldown: 5,

  execute: async (client, message, args) => {
    if (!message.guild) return;

    const channel = message.mentions.channels.first() ||
      message.guild.channels.cache.get(args[0]);

    if (!channel) {
      return message.channel.send('> ❌ Channel not found!');
    }

    try {
      const channelName = channel.name;
      await channel.delete();
      message.channel.send(`> ✅ Deleted channel: ${channelName}`);
    } catch (error) {
      log(`Error deleting channel: ${error.message}`, 'error');
      message.channel.send('> ❌ Error deleting channel.');
    }
  },
};