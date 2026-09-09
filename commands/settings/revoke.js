import { loadAllowedUsers, saveAllowedUsers, style, formatAnsiBlock } from "../../utils/functions.js";
import { THEME } from "../../utils/theme.js";

export default {
  name: "revoke",
  description: "Revoke bot access",
  category: "settings",
  ownerOnly: true,
  aliases: ["unauthorize"],
  async execute(client, message, args) {
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
    }

    let userId;

    if (message.mentions.users.size > 0) {
      userId = message.mentions.users.first().id;
    }

    else if (/^\d{17,19}$/.test(args[0])) {
      userId = args[0];
    }
    else if (message.guild) {
      const username = args.join(" ").toLowerCase();
      const member = message.guild.members.cache.find(m =>
        m.user.username.toLowerCase() === username ||
        m.displayName.toLowerCase() === username ||
        m.user.tag.toLowerCase() === username
      );
      if (member) userId = member.id;
    }

    if (!userId) {
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
    }
  },
};
