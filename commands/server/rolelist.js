import { log } from '../../utils/functions.js';

export default {
  name: "rolelist",
  description: "List all server roles and info",
  aliases: ["roles", "listroles", "serverroles"],
  usage: 'rolelist',
  category: 'server',
  type: 'server_only',
  permissions: ['ViewAuditLog'],
  cooldown: 5,

  execute: async (client, message, args) => {
    if (!message.guild) return;

    const roles = message.guild.roles.cache.sort((a, b) => b.position - a.position);

    let output = [`**Server Roles:**\n`];

    for (const role of roles.values()) {
      const memberCount = role.members.size;
      output.push(`• ${role.name} | Members: ${memberCount} | ID: ${role.id}`);

      if (output.join("\n").length > 1900) {
        await message.channel.send(output.join("\n"));
        output = [];
      }
    }

    if (output.length) {
      await message.channel.send(output.join("\n"));
    }
  },
};