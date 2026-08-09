import { log } from '../../utils/functions.js';

export default {
  name: "deleterole",
  description: "Delete an existing role",
  aliases: ["drole"],
  usage: '<role_name/ID/mention>',
  category: 'server',
  type: 'server_only',
  permissions: ['ManageRoles'],
  cooldown: 5,

  /**
   * Execute the deleterole command
   * @param {Client} client - Discord.js client instance
   * @param {Message} message - The message object
   * @param {Array} args - Command arguments
   */
  execute: async (client, message, args) => {
    try {
      if (!message.guild) return;

      const roleInput = args.join(' ');
      if (!roleInput) {
        return message.channel.send('> ❌ **Error:** Please provide a role name, ID, or mention.');
      }

      let role;
      if (roleInput.startsWith('<@&') && roleInput.endsWith('>')) {
        // Role mention
        const roleId = roleInput.slice(3, -1);
        role = message.guild.roles.cache.get(roleId);
      } else if (/^\d+$/.test(roleInput)) {
        // Role ID
        role = message.guild.roles.cache.get(roleInput);
      } else {
        // Role name
        role = message.guild.roles.cache.find(r => r.name === roleInput);
      }

      if (!role) {
        return message.channel.send('> ❌ **Error:** Role not found.');
      }

      try {
        await role.delete('Role deleted by selfbot');
        message.channel.send(`> ✅ Deleted role: ${role.name}`);
      } catch (error) {
        log(`Failed to delete role: ${error.message}`, "error");
        message.channel.send('> ❌ **Error:** Failed to delete role.');
      }
    } catch (error) {
      log(`Error executing deleterole command: ${error.message}`, "error");
      message.channel.send('> ❌ **Error:** An error occurred while executing the command.');
    }
  },
};