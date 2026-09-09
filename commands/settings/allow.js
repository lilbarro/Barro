import { loadAllowedUsers, saveAllowedUsers } from "../../utils/functions.js";

export default {
  name: "allow",
  description: "Allow a user to use the selfbot commands",
  category: "settings",
  ownerOnly: true,
  aliases: ["authorize"],
  async execute(client, message, args) {
    if (!args[0]) {
      return message.channel.send("> ❌ **Error:** Please provide a user mention, ID, or username.");
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
        return message.channel.send("> ❌ **Error:** Could not find that user. Try using a mention or ID.");
    }

    const allowedUsers = loadAllowedUsers();

    if (allowedUsers.includes(userId)) {
      return message.channel.send(`> ⚠️ **Notice:** User <@${userId}> is already in the allowed list.`);
    }

    allowedUsers.push(userId);
    const success = saveAllowedUsers(allowedUsers);

    if (success) {
      message.channel.send(`> ✅ **Success:** User <@${userId}> has been allowed to use the selfbot.`);
    } else {
      message.channel.send("> ❌ **Error:** Failed to save the allowed users list.");
    }
  },
};
