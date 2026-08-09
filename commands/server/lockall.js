import { log } from '../../utils/functions.js';

export default {
  name: "lockall",
  description: "Lock or unlock all channels",
  aliases: ["lockchannel", "lockchannels"],
  usage: 'lockall <lock/unlock>',
  category: 'server',
  type: 'server_only',
  permissions: ['ManageChannels'],
  cooldown: 5,

  execute: async (client, message, args) => {
    if (!message.guild) return;

    const setting = args[0];

    if (!['lock', 'unlock'].includes(setting)) {
      return message.channel.send('> ❌ Invalid setting! Use: lock/unlock');
    }

    const confirmationMsg = await message.channel.send(`> ⏳ ${setting === 'lock' ? 'Locking' : 'Unlocking'} all channels...`);

    try {
      let done = 0;
      let failed = 0;

      for (const channel of message.guild.channels.cache.values()) {
        if (channel.type !== 'GUILD_TEXT' && channel.type !== 'GUILD_VOICE') continue;

        try {
          await channel.permissionOverwrites.edit(message.guild.id, {
            SEND_MESSAGES: setting === 'unlock'
          });

          done++;
        } catch (error) {
          failed++;
        }

        await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit safety
      }

      confirmationMsg.edit(`> ✅ ${setting === 'lock' ? 'Locked' : 'Unlocked'} ${done} channels\n> ❌ Failed: ${failed}`);
    } catch (error) {
      log(`Error locking/unlocking channels: ${error.message}`, 'error');
      confirmationMsg.edit('> ❌ Error locking/unlocking channels.');
    }
  },
};