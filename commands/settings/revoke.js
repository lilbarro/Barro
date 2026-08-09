import { loadAllowedUsers, saveAllowedUsers } from "../../utils/functions.js";

export default {
  name: "revoke",
  description: "Revoke a user's access to the selfbot commands",
  category: "settings",
  ownerOnly: true,
  aliases: ["unauthorize"],
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
    }
  },
};
