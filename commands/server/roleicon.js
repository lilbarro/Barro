import { log } from "../../utils/functions.js";

export default {
  name: "roleicon",
  description: "Set an emoji icon for a role (requires server boost level 2+)",
  aliases: ["setroleicon", "ri"],
  usage: "<@role/role_id> <emoji> | roleicon remove <@role/role_id>",
  category: "server",
  type: "server_only",
  permissions: ["ManageRoles"], // Required permission to manage roles
  cooldown: 5,

  async execute(client, message, args) {
    if (!args.length) {
      return message.channel.send(
        "> ❌ **Please specify a command!**\n" +
          `**Usage:**\n` +
          `• \`${client.prefix}roleicon @role :emoji:\` - Set role icon\n` +
          `• \`${client.prefix}roleicon remove @role\` - Remove role icon\n` +
          `• \`${client.prefix}roleicon list\` - List roles with icons\n\n` +
          `**Note:** Server must have boost level 2+ (8+ boosts) to use role icons`
      );
    }

    const subcommand = args[0].toLowerCase();

    // Handle subcommands
    if (subcommand === "remove" || subcommand === "delete") {
      return this.removeRoleIcon(client, message, args.slice(1));
    }

    if (subcommand === "list" || subcommand === "show") {
      return this.listRoleIcons(client, message);
    }

    // Default: set role icon
    return this.setRoleIcon(client, message, args);
  },

  async setRoleIcon(client, message, args) {
    if (args.length < 2) {
      return message.channel.send(
        "> ❌ **Please specify a role and emoji!**\n" +
          `> **Usage:** \`${client.prefix}roleicon @role :emoji:\``
      );
    }

    // Check server boost level
    const boostCheck = this.checkBoostLevel(message.guild);
    if (!boostCheck.canUseRoleIcons) {
      return message.channel.send(
        `> ❌ **Server boost level too low!**\n` +
          `> **Current:** Level ${boostCheck.currentLevel} (${boostCheck.currentBoosts} boosts)\n` +
          `> **Required:** Level 2+ (8+ boosts)\n` +
          `> **Missing:** ${boostCheck.boostsNeeded} more boosts needed`
      );
    }

    // Parse role
    let targetRole = null;
    if (message.mentions.roles.size > 0) {
      targetRole = message.mentions.roles.first();
    } else {
      const roleId = args[0].replace(/[<@&>]/g, "");
      if (/^\d+$/.test(roleId)) {
        targetRole = message.guild.roles.cache.get(roleId);
      } else {
        // Try to find by name
        targetRole = message.guild.roles.cache.find(
          (role) => role.name.toLowerCase() === args[0].toLowerCase()
        );
      }
    }

    if (!targetRole) {
      return message.channel.send(
        "> ❌ **Role not found!**\n" +
          "> Please mention a role, provide a role ID, or use the exact role name."
      );
    }

    // Check role hierarchy (selfbot - user and bot are the same)
    if (
      targetRole.position >= message.member.roles.highest.position &&
      message.author.id !== message.guild.ownerId
    ) {
      return message.channel.send(
        "> ❌ **Cannot modify this role due to role hierarchy!**"
      );
    }

    // Parse emoji
    const emojiInput = args[1];
    const emojiData = this.parseEmoji(emojiInput, message.guild);

    if (!emojiData.valid) {
      return message.channel.send(
        `> ❌ **Invalid emoji!**\n` +
          `> ${emojiData.error}\n\n` +
          `**Valid formats:**\n` +
          `• Unicode emoji: 😀 🎉 ⭐\n` +
          `• Custom emoji: :custom_emoji:\n` +
          `• Emoji ID: 123456789012345678`
      );
    }

    try {
      // Set the role icon
      await targetRole.setIcon(
        emojiData.icon,
        `Role icon set by ${message.author.tag}`
      );

      await message.channel.send(
        `> ✅ **Successfully set role icon!**\n` +
          `> 🎭 **Role:** ${targetRole.name}\n` +
          `> ${emojiData.display} **Icon:** ${emojiData.name}\n` +
          `> 📊 **Server Boost Level:** ${boostCheck.currentLevel} (${boostCheck.currentBoosts} boosts)`
      );

      log(
        `${message.author.tag} set icon for role ${targetRole.name} to ${emojiData.name}`,
        "debug"
      );
    } catch (error) {
      log(`Error setting role icon: ${error.message}`, "error");

      if (error.code === 50013) {
        return message.channel.send(
          "> ❌ **Missing permissions to modify this role!**"
        );
      } else if (error.code === 50035) {
        return message.channel.send("> ❌ **Invalid emoji or role data!**");
      } else if (error.code === 50001) {
        return message.channel.send("> ❌ **Missing access to modify roles!**");
      } else {
        return message.channel.send(
          `> ❌ **Failed to set role icon:** ${error.message}`
        );
      }
    }
  },

  async removeRoleIcon(client, message, args) {
    if (!args.length) {
      return message.channel.send(
        "> ❌ **Please specify a role to remove icon from!**\n" +
          `> **Usage:** \`${client.prefix}roleicon remove @role\``
      );
    }

    // Parse role
    let targetRole = null;
    if (message.mentions.roles.size > 0) {
      targetRole = message.mentions.roles.first();
    } else {
      const roleId = args[0].replace(/[<@&>]/g, "");
      if (/^\d+$/.test(roleId)) {
        targetRole = message.guild.roles.cache.get(roleId);
      } else {
        targetRole = message.guild.roles.cache.find(
          (role) => role.name.toLowerCase() === args[0].toLowerCase()
        );
      }
    }

    if (!targetRole) {
      return message.channel.send("> ❌ **Role not found!**");
    }

    // Check if role has an icon
    if (!targetRole.icon) {
      return message.channel.send(
        `> ❌ **Role "${targetRole.name}" doesn't have an icon!**`
      );
    }

    // Check role hierarchy (selfbot - user and bot are the same)
    if (
      targetRole.position >= message.member.roles.highest.position &&
      message.author.id !== message.guild.ownerId
    ) {
      return message.channel.send(
        "> ❌ **Cannot modify this role due to role hierarchy!**"
      );
    }

    try {
      // Remove the role icon
      await targetRole.setIcon(
        null,
        `Role icon removed by ${message.author.tag}`
      );

      await message.channel.send(
        `> ✅ **Successfully removed role icon!**\n` +
          `> 🎭 **Role:** ${targetRole.name}`
      );

      log(
        `${message.author.tag} removed icon from role ${targetRole.name}`,
        "debug"
      );
    } catch (error) {
      log(`Error removing role icon: ${error.message}`, "error");
      return message.channel.send(
        `> ❌ **Failed to remove role icon:** ${error.message}`
      );
    }
  },

  async listRoleIcons(client, message) {
    const rolesWithIcons = message.guild.roles.cache.filter(
      (role) => role.icon
    );

    if (rolesWithIcons.size === 0) {
      return message.channel.send("> 📝 **No roles have icons set!**");
    }

    const boostInfo = this.checkBoostLevel(message.guild);
    let listText = `> 🎭 **Roles with Icons (${rolesWithIcons.size}):**\n\n`;

    rolesWithIcons.forEach((role) => {
      const iconUrl = role.iconURL();
      const iconDisplay = iconUrl ? `<:icon:${role.icon}>` : "❓";
      listText += `${iconDisplay} **${role.name}** (${role.members.size} members)\n`;
    });

    listText += `\n> 📊 **Server Boost:** Level ${boostInfo.currentLevel} (${boostInfo.currentBoosts} boosts)`;

    await message.channel.send(listText);
  },

  /**
   * Check server boost level and role icon availability
   * @param {Guild} guild - Discord guild object
   * @returns {Object} Boost level information
   */
  checkBoostLevel(guild) {
    const boostCount = guild.premiumSubscriptionCount || 0;
    const boostLevel = guild.premiumTier || 0;

    // Role icons require boost level 2 (8+ boosts)
    const canUseRoleIcons = boostLevel >= 2;
    const boostsNeeded = Math.max(0, 8 - boostCount);

    return {
      currentLevel: boostLevel,
      currentBoosts: boostCount,
      canUseRoleIcons,
      boostsNeeded,
    };
  },

  /**
   * Parse emoji input and validate
   * @param {string} input - Emoji input string
   * @param {Guild} guild - Discord guild object
   * @returns {Object} Parsed emoji data
   */
  parseEmoji(input, guild) {
    // Check if it's a custom emoji mention
    const customEmojiMatch = input.match(/<a?:(\w+):(\d+)>/);
    if (customEmojiMatch) {
      const [, name, id] = customEmojiMatch;
      const emoji = guild.emojis.cache.get(id);

      if (emoji) {
        return {
          valid: true,
          icon: id,
          name: name,
          display: `<:${name}:${id}>`,
        };
      } else {
        return {
          valid: false,
          error: "Custom emoji not found in this server",
        };
      }
    }

    // Check if it's just an emoji ID
    if (/^\d+$/.test(input)) {
      const emoji = guild.emojis.cache.get(input);
      if (emoji) {
        return {
          valid: true,
          icon: input,
          name: emoji.name,
          display: `<:${emoji.name}:${input}>`,
        };
      } else {
        return {
          valid: false,
          error: "Emoji ID not found in this server",
        };
      }
    }

    // Check if it's a unicode emoji
    const unicodeEmojiRegex =
      /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
    if (unicodeEmojiRegex.test(input)) {
      return {
        valid: true,
        icon: input,
        name: "Unicode Emoji",
        display: input,
      };
    }

    return {
      valid: false,
      error: "Invalid emoji format",
    };
  },
};
