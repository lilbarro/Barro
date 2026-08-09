import { log } from '../../utils/functions.js';

export default {
  name: "renamerole",
  description: "Rename a role and optionally set its color",
  aliases: ["rolecolor", "rolename", "editrole"],
  usage: '<role> <new_name> [color hex]',
  category: 'server',
  type: 'server_only',
  permissions: ['ManageRoles'],
  cooldown: 5,

  /**
   * Execute the renamerole command
   * @param {Client} client - Discord.js client instance
   * @param {Message} message - The message object
   * @param {Array} args - Command arguments
   */
  execute: async (client, message, args) => {
    try {
      if (!message.guild) return;

      const roleInput = args.shift();
      const newName = args.shift();
      const colorHex = args.shift();

      if (!roleInput || !newName) {
        return message.channel.send('> ❌ **Error:** Please provide a role, new name, and optional color.');
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

      const updateData = { name: newName };
      if (colorHex) {
        updateData.color = colorHex;
      }

      try {
        await role.edit(updateData, 'Role updated by selfbot');
        message.channel.send(`> ✅ Updated role: ${role.name}`);
      } catch (error) {
        log(`Failed to update role: ${error.message}`, "error");
        message.channel.send('> ❌ **Error:** Failed to update role.');
      }
    } catch (error) {
      log(`Error executing renamerole command: ${error.message}`, "error");
      message.channel.send('> ❌ **Error:** An error occurred while executing the command.');
    }
  },
};