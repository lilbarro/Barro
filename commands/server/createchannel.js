import { log } from '../../utils/functions.js';

export default {
  name: "createchannel",
  description: "Create new channel",
  aliases: ["cchannel", "makechannel"],
  usage: 'createchannel <text/voice/stage> <name>',
  category: 'server',
  type: 'server_only',
  permissions: ['ManageChannels'],
  cooldown: 5,

  execute: async (client, message, args) => {
    if (!message.guild) return;

    const channelType = args[0];
    const channelName = args.slice(1).join(' ');

    if (!['text', 'voice', 'stage'].includes(channelType)) {
      return message.channel.send('> ❌ Invalid channel type! Use: text/voice/stage');
    }

    try {
      let newChannel;

      if (channelType === 'text') {
        newChannel = await message.guild.channels.create({
          name: channelName,
          type: 'GUILD_TEXT'
        });
      } else if (channelType === 'voice') {
        newChannel = await message.guild.channels.create({
          name: channelName,
          type: 'GUILD_VOICE'
        });
      } else if (channelType === 'stage') {
        newChannel = await message.guild.channels.create({
          name: channelName,
          type: 'GUILD_STAGE_VOICE'
        });
      }

      message.channel.send(`> ✅ Created ${channelType} channel: ${newChannel}`);
    } catch (error) {
      log(`Error creating channel: ${error.message}`, 'error');
      message.channel.send('> ❌ Error creating channel.');
    }
  },
};