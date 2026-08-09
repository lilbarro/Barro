import { log } from '../../utils/functions.js';

export default {
  name: "createcategory",
  description: "Create category channel",
  aliases: ["ccat", "newcategory"],
  usage: 'createcategory <name>',
  category: 'server',
  type: 'server_only',
  permissions: ['ManageChannels'],
  cooldown: 5,

  execute: async (client, message, args) => {
    if (!message.guild) return;

    const categoryName = args.join(' ');

    try {
      const category = await message.guild.channels.create({
        name: categoryName,
        type: 'GUILD_CATEGORY'
      });

      message.channel.send(`> ✅ Created category: ${category.name}`);
    } catch (error) {
      log(`Error creating category: ${error.message}`, 'error');
      message.channel.send('> ❌ Error creating category.');
    }
  },
};