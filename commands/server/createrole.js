import { log } from '../../utils/functions.js';

export default {
  name: "createrole",
  description: "Create a new role",
  aliases: ["crole", "makerole"],
  usage: '<name>',
  category: 'server',
  type: 'server_only',
  permissions: ['ManageRoles'],
  cooldown: 5,

  /**
   * Execute the createrole command
   * @param {Client} client - Discord.js client instance
   * @param {Message} message - The message object
   * @param {Array} args - Command arguments
   */
  execute: async (client, message, args) => {
    try {
      if (!message.guild) return;

      const roleName = args.join(' ');
      if (!roleName) {
        return message.channel.send('> ❌ **Error:** Please provide a role name.');
      }

      try {
        const role = await message.guild.roles.create({
          name: roleName,
          reason: 'Role created by selfbot',
        });

        message.channel.send(`> ✅ Created role ${role}`);
      } catch (error) {
        log(`Failed to create role: ${error.message}`, "error");
        message.channel.send('> ❌ **Error:** Failed to create role.');
      }
    } catch (error) {
      log(`Error executing createrole command: ${error.message}`, "error");
      message.channel.send('> ❌ **Error:** An error occurred while executing the command.');
    }
  },
};