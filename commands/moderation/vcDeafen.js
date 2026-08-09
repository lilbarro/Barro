import { log } from "../../utils/functions.js";

export default {
  name: "vcdeafen",
  description: "Server deafen a user in voice channels",
  aliases: ["voicedeafen", "vdeafen"],
  usage: "<@user/user_id>",
  category: "moderation",
  type: "server_only",
  permissions: ["DeafenMembers"], // Required permission to deafen users in VC
  cooldown: 3,

  async execute(client, message, args) {
    if (!args.length) {
      return message.channel.send(
        "> ❌ **Please specify a user to deafen in voice channels!**\n" +
          `> **Usage:** \`${client.prefix}vcdeafen @user\``
      );
    }

    let targetUser = null;
    let targetMember = null;

    // Parse user from mention or ID
    if (message.mentions.users.size > 0) {
      targetUser = message.mentions.users.first();
    } else if (args[0]) {
      try {
        const userId = args[0].replace(/[<@!>]/g, "");
        if (/^\d+$/.test(userId)) {
          targetUser = await client.users.fetch(userId);
        }
      } catch (error) {
        return message.channel.send(
          "> ❌ **User not found!** Please mention a valid user or provide a valid user ID."
        );
      }
    }

    if (!targetUser) {
      return message.channel.send(
        "> ❌ **Please specify a user to deafen in voice channels!**\n" +
          `> **Usage:** \`${client.prefix}vcdeafen @user\``
      );
    }

    try {
      // Get the member object from the guild
      targetMember = await message.guild.members.fetch(targetUser.id);
    } catch (error) {
      return message.channel.send(
        "> ❌ **User is not a member of this server!**"
      );
    }

    
    // Check role hierarchy
    if (
      targetMember.roles.highest.position >=
        message.member.roles.highest.position &&
      message.author.id !== message.guild.ownerId
    ) {
      return message.channel.send(
        "> ❌ **You cannot deafen this user due to role hierarchy!**"
      );
    }

    // Check if user is already deafened
    if (targetMember.voice.serverDeaf) {
      return message.channel.send(
        `> ❌ **${targetUser.username} is already server deafened in voice channels!**`
      );
    }

    try {
      // Server deafen the user
      await targetMember.voice.setDeaf(
        true,
        `Voice deafened by ${message.author.tag}`
      );

      const statusText = targetMember.voice.channel
        ? `Currently in: ${targetMember.voice.channel.name}`
        : "Not currently in a voice channel";

      await message.channel.send(
        `> ✅ **Successfully server deafened ${targetUser.username} in voice channels!**\n` +
          `> 🔇 **Status:** ${statusText}\n` +
          `> 📝 **Note:** User cannot hear audio in any voice channel until undeafened`
      );

      log(
        `${message.author.tag} server deafened ${targetUser.username} in voice channels`,
        "debug"
      );
    } catch (error) {
      log(`Error deafening user in voice channels: ${error.message}`, "error");

      if (error.code === 50013) {
        return message.channel.send(
          "> ❌ **Missing permissions to deafen this user!**"
        );
      } else if (error.code === 10007) {
        return message.channel.send("> ❌ **User not found in this server!**");
      } else {
        return message.channel.send(
          `> ❌ **Failed to deafen user:** ${error.message}`
        );
      }
    }
  },
};
