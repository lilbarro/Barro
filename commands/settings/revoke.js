<<<<<<< HEAD
import { loadAllowedUsers, saveAllowedUsers, style, formatAnsiBlock } from "../../utils/functions.js";
import { THEME } from "../../utils/theme.js";

export default {
  name: "revoke",
  description: "Revoke bot access",
=======
import { loadAllowedUsers, saveAllowedUsers } from "../../utils/functions.js";

export default {
  name: "revoke",
  description: "Revoke a user's access to the selfbot commands",
>>>>>>> origin/main
  category: "settings",
  ownerOnly: true,
  aliases: ["unauthorize"],
  async execute(client, message, args) {
<<<<<<< HEAD
    if (args[0] && ["help", "--help", "-h"].includes(args[0].toLowerCase())) {
      return message.channel.send(`> **Revoke Help**\n> Usage: \`${client.prefix}revoke <@user|user_id|username>\`\n> Aliases: \`${client.prefix}unauthorize\``);
    }

    if (!args[0]) {
      return message.channel.send(
        formatAnsiBlock([
          style(`Barro`, THEME.HEADER_BOLD_COLOR) + style(` Settings | Revoke`, THEME.ACCENT_COLOR),
          style(`❌ Please provide a user mention, ID, or username.`, THEME.LABEL_COLOR)
        ])
      );
=======
    if (!args[0]) {
      return message.channel.send("> ❌ **Error:** Please provide a user mention, ID, or username.");
>>>>>>> origin/main
    }

    let userId;

    if (message.mentions.users.size > 0) {
      userId = message.mentions.users.first().id;
<<<<<<< HEAD
    }
=======
    } 
>>>>>>> origin/main

    else if (/^\d{17,19}$/.test(args[0])) {
      userId = args[0];
    }
    else if (message.guild) {
      const username = args.join(" ").toLowerCase();
<<<<<<< HEAD
      const member = message.guild.members.cache.find(m =>
        m.user.username.toLowerCase() === username ||
=======
      const member = message.guild.members.cache.find(m => 
        m.user.username.toLowerCase() === username || 
>>>>>>> origin/main
        m.displayName.toLowerCase() === username ||
        m.user.tag.toLowerCase() === username
      );
      if (member) userId = member.id;
    }

    if (!userId) {
<<<<<<< HEAD
        return message.channel.send(
          formatAnsiBlock([
            style(`Barro`, THEME.HEADER_BOLD_COLOR) + style(` Settings | Revoke`, THEME.ACCENT_COLOR),
            style(`❌ Could not find that user. Try using a mention or ID.`, THEME.LABEL_COLOR)
          ])
        );
    }

    const accountId = client.user.id;
    let allowedUsers = loadAllowedUsers(accountId);

    if (!allowedUsers.includes(userId)) {
      return message.channel.send(
        formatAnsiBlock([
          style(`Barro`, THEME.HEADER_BOLD_COLOR) + style(` Settings | Revoke`, THEME.ACCENT_COLOR),
          style(`⚠️ User <@${userId}> is not in the allowed list.`, THEME.LABEL_COLOR)
        ])
      );
    }

    allowedUsers = allowedUsers.filter(id => id !== userId);
    const success = saveAllowedUsers(accountId, allowedUsers);

    if (success) {
      message.channel.send(
        formatAnsiBlock([
          style(`Barro`, THEME.HEADER_BOLD_COLOR) + style(` Settings | Revoke`, THEME.ACCENT_COLOR),
          style(`✅ User <@${userId}> has had their access revoked.`, THEME.ACCENT_COLOR)
        ])
      );
    } else {
      message.channel.send(
        formatAnsiBlock([
          style(`Barro`, THEME.HEADER_BOLD_COLOR) + style(` Settings | Revoke`, THEME.ACCENT_COLOR),
          style(`❌ Failed to save the allowed users list.`, THEME.LABEL_COLOR)
        ])
      );
=======
        return message.channel.send("> ❌ **Error:** Could not find that user. Try using a mention or ID.");
    }

    let allowedUsers = loadAllowedUsers();

    if (!allowedUsers.includes(userId)) {
      return message.channel.send(`> ⚠️ **Notice:** User <@${userId}> is not in the allowed list.`);
    }

    allowedUsers = allowedUsers.filter(id => id !== userId);
    const success = saveAllowedUsers(allowedUsers);

    if (success) {
      message.channel.send(`> ✅ **Success:** User <@${userId}> has had their access revoked.`);
    } else {
      message.channel.send("> ❌ **Error:** Failed to save the allowed users list.");
>>>>>>> origin/main
    }
  },
};
