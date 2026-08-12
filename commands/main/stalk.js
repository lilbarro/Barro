import { log } from "../../utils/functions.js";
import StalkManager from "../../utils/StalkManager.js";

export default {
  name: "stalk",
  description: "Start or stop stalking a user to monitor their activities",
  aliases: ["monitor", "track"],
  usage: "<@user/userID> | stop <@user/userID> | list",
  category: "troll",
  type: "both",
  permissions: ["SendMessages"],
  cooldown: 60,

  async execute(client, message, args) {
    try {
      if (!args.length) {
        return message.channel.send(formatAnsiBlock([
          style('[ STALK ]', '1;30'),
          '',
          style('USAGE:', '1;31'),
          `  • ${client.prefix}stalk <@user/userID> - Start stalking a user`,
          `  • ${client.prefix}stalk stop <@user/userID> - Stop stalking a user`,
          `  • ${client.prefix}stalk list - List all stalked users`
        ]));
      }

      const subcommand = args[0].toLowerCase();

      // Handle list subcommand
      if (subcommand === "list") {
        return this.listStalkedUsers(client, message);
      }

      // Handle stop subcommand
      if (subcommand === "stop") {
        if (!args[1]) {
          return message.channel.send(
            "> ❌ Please specify a user to stop stalking.\n" +
              `> **Usage:** \`${client.prefix}stalk stop <@user/userID>\``
          );
        }
        return this.stopStalking(client, message, args[1]);
      }

      // Handle start stalking (default)
      return this.startStalking(client, message, args[0]);
    } catch (error) {
      log(`Error in stalk command: ${error.message}`, "error");
      message.channel.send(`> ❌ An error occurred: ${error.message}`);
    }
  },

  /**
   * Start stalking a user
   */
  async startStalking(client, message, userInput) {
    try {
      // Simple user resolution like userinfo command
      let targetUser = null;

      // Try to get user by mention first
      if (message.mentions.users.first()) {
        targetUser = message.mentions.users.first();
      } else {
        // Try to fetch by ID
        try {
          targetUser = await client.users.fetch(userInput);
        } catch (error) {
          // User not found
        }
      }

      if (!targetUser) {
        return message.channel.send(
          "> ❌ **User not found!**\n" +
            "> Please provide a valid user mention or ID."
        );
      }

      // Check if already stalking
      if (StalkManager.isStalking(targetUser.id)) {
        return message.channel.send(
          `> ⚠️ **Already stalking ${targetUser.tag}!**\n` +
            `> Use \`${client.prefix}stalk stop ${targetUser.id}\` to stop stalking.`
        );
      }

      // Check if trying to stalk self
      if (targetUser.id === client.user.id) {
        return message.channel.send("> ❌ **You cannot stalk yourself!**");
      }

      // Start stalking
      const userInfo = {
        username: targetUser.username,
        tag: targetUser.tag,
        selfbotTag: client.user.tag,
      };

      const success = StalkManager.startStalking(targetUser.id, userInfo);

      if (success) {
        await message.channel.send(formatColoredHeaders(
          `> ✅ **Started stalking ${targetUser.tag}!**\n` +
            `> 👁️ Now monitoring:\n` +
            `> • Messages (sent, edited, deleted)\n` +
            `> • Voice channel activity\n` +
            `> • Presence changes\n` +
            `> \n` +
            `> Use \`${client.prefix}viewstalk ${targetUser.id}\` to view logs.`
        ));

        log(
          `Started stalking user ${targetUser.tag} (${targetUser.id})`,
          "debug"
        );
      } else {
        await message.channel.send(
          `> ❌ **Failed to start stalking ${targetUser.tag}!**\n` +
            `> An error occurred while setting up the stalk session.`
        );
      }
    } catch (error) {
      log(`Error starting stalk: ${error.message}`, "error");
      message.channel.send(`> ❌ An error occurred: ${error.message}`);
    }
  },

  /**
   * Stop stalking a user
   */
  async stopStalking(client, message, userInput) {
    try {
      // Simple user resolution like userinfo command
      let targetUser = null;

      // Try to get user by mention first
      if (message.mentions.users.first()) {
        targetUser = message.mentions.users.first();
      } else {
        // Try to fetch by ID
        try {
          targetUser = await client.users.fetch(userInput);
        } catch (error) {
          // User not found
        }
      }

      if (!targetUser) {
        return message.channel.send(
          "> ❌ **User not found!**\n" +
            "> Please provide a valid user mention or ID."
        );
      }

      // Check if stalking
      if (!StalkManager.isStalking(targetUser.id)) {
        return message.channel.send(
          `> ❌ **Not stalking ${targetUser.tag}!**\n` +
            `> Use \`${client.prefix}stalk list\` to see all stalked users.`
        );
      }

      // Stop stalking
      const success = StalkManager.stopStalking(targetUser.id);

      if (success) {
        const stats = StalkManager.getStalkStats(targetUser.id);

        let responseText = `> ✅ **Stopped stalking ${targetUser.tag}!**\n`;

        if (stats) {
          responseText += `> 📊 **Session Summary:**\n`;
          responseText += `> • Messages Sent: ${stats.messagesSent}\n`;
          responseText += `> • Messages Edited: ${stats.messagesEdited}\n`;
          responseText += `> • Messages Deleted: ${stats.messagesDeleted}\n`;
          responseText += `> • Voice Events: ${
            stats.voiceJoins + stats.voiceLeaves
          }\n`;
          responseText += `> • Presence Updates: ${stats.presenceUpdates}\n`;
          responseText += `> • Total Events: ${stats.totalEvents}\n`;
        }

        responseText += `> \n> Use \`${client.prefix}viewstalk ${targetUser.id}\` to view full logs.`;

        await message.channel.send(formatColoredHeaders(responseText));
        log(
          `Stopped stalking user ${targetUser.tag} (${targetUser.id})`,
          "debug"
        );
      } else {
        await message.channel.send(
          `> ❌ **Failed to stop stalking ${targetUser.tag}!**\n` +
            `> An error occurred while ending the stalk session.`
        );
      }
    } catch (error) {
      log(`Error stopping stalk: ${error.message}`, "error");
      message.channel.send(`> ❌ An error occurred: ${error.message}`);
    }
  },

  /**
   * List all stalked users
   */
  async listStalkedUsers(client, message) {
    try {
      const stalkedUsers = StalkManager.getStalkedUsers();

      if (stalkedUsers.size === 0) {
        return message.channel.send(
          `> 📝 **No users are currently being stalked.**\n` +
            `> Use \`${client.prefix}stalk <@user/userID>\` to start stalking someone.`
        );
      }

      let listText = `> 👁️ **Currently Stalked Users (${stalkedUsers.size}):**\n\n`;

      for (const [userId, stalkInfo] of stalkedUsers) {
        const duration = new Date() - stalkInfo.startTime;
        const stats = StalkManager.getStalkStats(userId);

        listText += `> **${stalkInfo.tag}** (${userId})\n`;
        listText += `> • Started: ${stalkInfo.startTime.toLocaleString()}\n`;
        listText += `> • Duration: ${StalkManager.formatDuration(duration)}\n`;

        if (stats) {
          listText += `> • Events: ${stats.totalEvents} total\n`;
        }

        listText += `> • View: \`${client.prefix}viewstalk ${userId}\`\n`;
        listText += `> • Stop: \`${client.prefix}stalk stop ${userId}\`\n\n`;
      }

      await message.channel.send(formatColoredHeaders(listText));
    } catch (error) {
      log(`Error listing stalked users: ${error.message}`, "error");
      message.channel.send(`> ❌ An error occurred: ${error.message}`);
    }
  },
};

function style(text, colorCode) {
  return `\u001b[${colorCode}m${text}\u001b[0m`;
}

function formatAnsiBlock(lines) {
  return ["> ```ansi", ...lines.map((line) => `> ${line}`), "> ```"].join("\n");
}

function formatColoredHeaders(text) {
  let firstHeader = true;
  const lines = text.split("\n").map((line) => {
    const content = line.replace(/^> ?/, "");
    const header = content.match(/^(?:[^*]+ )?\*\*(.+?)\*\*:?$/);

    if (!header) return content;

    const color = firstHeader ? "1;30" : "1;31";
    firstHeader = false;
    return content.replace(`**${header[1]}**`, style(header[1], color));
  });

  return formatAnsiBlock(lines);
}
