import { log } from '../../utils/functions.js';

export default {
  name: "massnick",
  description: "Mass change member nicknames.",
  aliases: ["nickall", "allnick"],
  usage: '<nickname>',
  category: 'server',
  type: 'server_only',
  permissions: ['ManageNicknames'],
  cooldown: 60,

  execute: async (client, message, args) => {
    if (!message.guild) return;

    const nickname = args.join(' ');
    if (!nickname) {
      return message.channel.send('> ❌ Please provide a nickname.');
    }

    const confirmationMsg = await message.channel.send(`> ⏳ Changing nicknames to "${nickname}"...`);

    try {
      let changed = 0;
      let failed = 0;

      for (const member of message.guild.members.cache.values()) {
        try {
          await member.setNickname(nickname, 'Mass nickname change initiated by selfbot');
          changed++;
        } catch (error) {
          failed++;
          log(`Failed to change nickname for ${member.user.tag}: ${error.message}`, 'error');
        }

        await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit safety
      }

      confirmationMsg.edit(`> ✅ Changed ${changed} nicknames. Failed: ${failed}`);
    } catch (error) {
      log(`Error during mass nickname change: ${error.message}`, 'error');
      confirmationMsg.edit('> ❌ Error changing nicknames.');
    }
  },
};