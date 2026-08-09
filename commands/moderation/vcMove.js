import { log } from "../../utils/functions.js";

export default {
  name: "vcmove",
  description: "Move a user from one voice channel to another",
  aliases: ["voicemove", "vm"],
  usage: "<@user/user_id> <channel_id/channel_name>",
  category: "moderation",
  type: "server_only",
  permissions: ["MoveMembers"], // Required permission to move users between VCs
  cooldown: 3,

  async execute(client, message, args) {
    if (args.length < 2) {
      return message.channel.send(
        "> ❌ **Please specify a user and target channel!**\n" +
          `> **Usage:** \`${client.prefix}vcmove @user #channel\`\n` +
          `> **Example:** \`${client.prefix}vcmove @user 123456789012345678\``
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
        "> ❌ **Please specify a user to move!**\n" +
          `> **Usage:** \`${client.prefix}vcmove @user #channel\``
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

    // Check if the target user is in a voice channel
    if (!targetMember.voice.channel) {
      return message.channel.send(
        `> ❌ **${targetUser.username} is not in a voice channel!**`
      );
    }

    // Parse target channel
    let targetChannel = null;
    const channelInput = args[1];

    // Try to find channel by mention first
    if (message.mentions.channels.size > 0) {
      targetChannel = message.mentions.channels.first();
    } else {
      // Try to find by ID
      const channelId = channelInput.replace(/[<#>]/g, "");
      if (/^\d+$/.test(channelId)) {
        targetChannel = message.guild.channels.cache.get(channelId);
      } else {
        // Try to find by name
        targetChannel = message.guild.channels.cache.find(
          (channel) =>
            channel.name.toLowerCase() === channelInput.toLowerCase() &&
            channel.type === 2 // Voice channel type
        );
      }
    }

    if (!targetChannel) {
      return message.channel.send(
        "> ❌ **Target channel not found!**\n" +
          "> Please provide a valid voice channel ID, mention, or name."
      );
    }

    // Check if target channel is a voice channel
    if (targetChannel.type !== 2) {
      return message.channel.send(
        "> ❌ **Target channel must be a voice channel!**"
      );
    }

    // Check if user is already in the target channel
    if (targetMember.voice.channel.id === targetChannel.id) {
      return message.channel.send(
        `> ❌ **${targetUser.username} is already in ${targetChannel.name}!**`
      );
    }

    
    // Check if bot can connect to target channel
    if (!targetChannel.permissionsFor(botMember).has("Connect")) {
      return message.channel.send(
        `> ❌ **I don't have permission to connect to ${targetChannel.name}!**`
      );
    }

    // Check role hierarchy
    if (
      targetMember.roles.highest.position >=
        message.member.roles.highest.position &&
      message.author.id !== message.guild.ownerId
    ) {
      return message.channel.send(
        "> ❌ **You cannot move this user due to role hierarchy!**"
      );
    }

    try {
      const fromChannel = targetMember.voice.channel.name;

      // Move the user to the target channel
      await targetMember.voice.setChannel(
        targetChannel,
        `Voice moved by ${message.author.tag}`
      );

      await message.channel.send(
        `> ✅ **Successfully moved ${targetUser.username}!**\n` +
          `> 📤 **From:** ${fromChannel}\n` +
          `> 📥 **To:** ${targetChannel.name}`
      );

      log(
        `${message.author.tag} moved ${targetUser.username} from ${fromChannel} to ${targetChannel.name}`,
        "debug"
      );
    } catch (error) {
      log(
        `Error moving user between voice channels: ${error.message}`,
        "error"
      );

      if (error.code === 50013) {
        return message.channel.send(
          "> ❌ **Missing permissions to move this user!**"
        );
      } else if (error.code === 10026) {
        return message.channel.send(
          "> ❌ **User is no longer in a voice channel!**"
        );
      } else if (error.code === 50035) {
        return message.channel.send("> ❌ **Invalid channel or user!**");
      } else {
        return message.channel.send(
          `> ❌ **Failed to move user:** ${error.message}`
        );
      }
    }
  },
};
