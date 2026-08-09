import { log } from '../../utils/functions.js';

export default {
  name: "channelsetup",
  description: "Create channel template setup",
  aliases: ["setupchannels", "createchannels"],
  usage: 'channelsetup [basic/community/gaming/educational/support]',
  category: 'server',
  type: 'server_only',
  permissions: ['ManageChannels'],
  cooldown: 5,

  execute: async (client, message, args) => {
    if (!message.guild) return;

    const template = args[0] || 'basic';

    const templates = {
      basic: [
        { category: 'INFORMATION', channels: ['rules', 'announcements', 'info'] },
        { category: 'GENERAL', channels: ['general', 'media', 'bot-commands'] }
      ],
      community: [
        { category: 'INFO', channels: ['rules', 'announcements', 'roles'] },
        { category: 'GENERAL', channels: ['general', 'media', 'memes'] },
        { category: 'COMMUNITY', channels: ['introductions', 'selfies', 'art'] },
        { category: 'VOICE', channels: ['General VC', 'Music', 'AFK'] }
      ],
      gaming: [
        { category: 'INFO', channels: ['rules', 'announcements'] },
        { category: 'GENERAL', channels: ['general', 'looking-for-game', 'clips'] },
        { category: 'GAMES', channels: ['valorant', 'minecraft', 'fortnite'] },
        { category: 'VOICE', channels: ['Team 1', 'Team 2', 'Lobby'] }
      ],
      educational: [
        { category: 'RESOURCES', channels: ['announcements', 'rules', 'resource-library'] },
        { category: 'DISCUSSIONS', channels: ['math-discussion', 'science-discussion', 'literature-discussion'] },
        { category: 'STUDY GROUPS', channels: ['math-study-group', 'science-study-group', 'literature-study-group'] }
      ],
      support: [
        { category: 'SUPPORT', channels: ['announcements', 'rules', 'support-tickets'] },
        { category: 'GENERAL CHAT', channels: ['general-chat', 'feedback'] }
      ]
    };

    if (!templates[template]) {
      return message.channel.send('> ❌ Invalid template! Available: basic/community/gaming/educational/support');
    }

    const confirmationMsg = await message.channel.send(`> ⏳ Creating ${template} server setup...`);

    try {
      for (const section of templates[template]) {
        const category = await message.guild.channels.create({
          name: section.category,
          type: 'GUILD_CATEGORY'
        });

        for (const channelName of section.channels) {
          if (channelName.toLowerCase().endsWith('vc')) {
            await message.guild.channels.create({
              name: channelName,
              type: 'GUILD_VOICE',
              parent: category.id
            });
          } else {
            await message.guild.channels.create({
              name: channelName,
              type: 'GUILD_TEXT',
              parent: category.id
            });
          }

          await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit safety
        }
      }

      confirmationMsg.edit(`> ✅ Created ${template} server setup!`);
    } catch (error) {
      log(`Error setting up channels: ${error.message}`, 'error');
      confirmationMsg.edit('> ❌ Error setting up channels.');
    }
  },
};