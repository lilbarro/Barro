import { log } from '../../utils/functions.js';

export default {
  name: "deletecategory",
  description: "Delete a category and its channels.",
  aliases: ["dcat", "removecategory"],
  usage: '<category_name>',
  category: 'server',
  type: 'server_only',
  permissions: ['ManageChannels'],
  cooldown: 5,

  execute: async (client, message, args) => {
    if (!message.guild) return;

    const categoryName = args.join(' ');
    if (!categoryName) {
      return message.channel.send('> ❌ Please provide a category name.');
    }

    const category = message.guild.channels.cache.find(c => c.name === categoryName && c.type === 'GUILD_CATEGORY');
    if (!category) {
      return message.channel.send('> ❌ Category not found!');
    }

    try {
      let deletedChannels = 0;
      let failedDeletions = 0;

      for (const channel of category.children.values()) {
        try {
          await channel.delete({ reason: 'Category deletion initiated by selfbot' });
          deletedChannels++;
        } catch (error) {
          failedDeletions++;
          log(`Failed to delete channel ${channel.name} (${channel.id}): ${error.message}`, 'error');
        }
      }

      await category.delete({ reason: 'Category deletion initiated by selfbot' });
      message.channel.send(`> ✅ Deleted category "${categoryName}" and ${deletedChannels} channels. Failed: ${failedDeletions}`);
    } catch (error) {
      log(`Error deleting category: ${error.message}`, 'error');
      message.channel.send('> ❌ Error deleting category.');
    }
  },
};