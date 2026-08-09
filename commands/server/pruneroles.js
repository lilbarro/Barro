import { log } from '../../utils/functions.js';

export default {
  name: "pruneroles",
  description: "Delete all roles with 0 members.",
  aliases: [],
  usage: '',
  category: 'server',
  type: 'server_only',
  permissions: ['ManageRoles'],
  cooldown: 60,

  execute: async (client, message, args) => {
    if (!message.guild) return;

    const emptyRoles = message.guild.roles.cache.filter(role => !role.members.size && role.name !== '@everyone');

    if (!emptyRoles.size) {
      return message.channel.send('> ✅ No empty roles found.');
    }

    const confirmationMsg = await message.channel.send(`> ⏳ Deleting ${emptyRoles.size} empty roles...`);

    try {
      let deleted = 0;
      let failed = 0;

      for (const role of emptyRoles.values()) {
        try {
          await role.delete({ reason: 'Prune empty roles initiated by selfbot' });
          deleted++;
        } catch (error) {
          failed++;
          log(`Failed to delete role ${role.name} (${role.id}): ${error.message}`, 'error');
        }

        await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit safety
      }

      confirmationMsg.edit(`> ✅ Deleted ${deleted} empty roles. Failed: ${failed}`);
    } catch (error) {
      log(`Error during role pruning: ${error.message}`, 'error');
      confirmationMsg.edit('> ❌ Error deleting roles.');
    }
  },
};