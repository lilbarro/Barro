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
        return message.channel.send(formatThreeBlock(
          "Barro Stalk",
          [["Usage", `${client.prefix}stalk <@user/userID>`], ["Stop", `${client.prefix}stalk stop <@user/userID>`], ["List", `${client.prefix}stalk list`]],
          [["Info", "Start, stop, or list stalked users."]]
        ));
      }

      const subcommand = args[0].toLowerCase();
      if (subcommand === "list") return this.listStalkedUsers(client, message);
      if (subcommand === "stop") {
        if (!args[1]) {
          return message.channel.send(formatThreeBlock(
            "Barro Stalk",
            [["Target", "Unknown"]],
            [["Result", `Please specify a user to stop stalking. Use ${client.prefix}stalk stop <@user/userID>`]]
          ));
        }
        return this.stopStalking(client, message, args[1]);
      }
      return this.startStalking(client, message, args[0]);
    } catch (error) {
      log(`Error in stalk command: ${error.message}`, "error");
      message.channel.send(formatThreeBlock("Barro Stalk", [["Status", "Error"]], [["Result", `An error occurred: ${error.message}`]]));
    }
  },

  async startStalking(client, message, userInput) {
    try {
      let targetUser = message.mentions.users.first() || null;
      if (!targetUser) {
        try {
          targetUser = await client.users.fetch(userInput);
        } catch {}
      }

      if (!targetUser) {
        return message.channel.send(formatThreeBlock("Barro Stalk", [["Target", "Unknown"]], [["Result", "User not found. Please provide a valid user mention or ID."]]));
      }

      if (StalkManager.isStalking(targetUser.id)) {
        return message.channel.send(formatThreeBlock("Barro Stalk", [["Target", targetUser.tag]], [["Result", `Already stalking. Use ${client.prefix}stalk stop ${targetUser.id} to stop stalking.`]]));
      }

      if (targetUser.id === client.user.id) {
        return message.channel.send(formatThreeBlock("Barro Stalk", [["Target", targetUser.tag]], [["Result", "You cannot stalk yourself!"]]));
      }

      const userInfo = { username: targetUser.username, tag: targetUser.tag, selfbotTag: client.user.tag };
      const success = StalkManager.startStalking(targetUser.id, userInfo);
      if (success) {
        await message.channel.send(formatThreeBlock(
          "Barro Stalk",
          [["Target", targetUser.tag], ["Status", "ACTIVE"]],
          [["Result", `Now monitoring messages, voice activity, and presence. Use ${client.prefix}viewstalk ${targetUser.id} to view logs.`]]
        ));
        log(`Started stalking user ${targetUser.tag} (${targetUser.id})`, "debug");
      } else {
        await message.channel.send(formatThreeBlock("Barro Stalk", [["Target", targetUser.tag]], [["Result", `Failed to start stalking ${targetUser.tag}.`]]));
      }
    } catch (error) {
      log(`Error starting stalk: ${error.message}`, "error");
      message.channel.send(formatThreeBlock("Barro Stalk", [["Status", "Error"]], [["Result", `An error occurred: ${error.message}`]]));
    }
  },

  async stopStalking(client, message, userInput) {
    try {
      let targetUser = message.mentions.users.first() || null;
      if (!targetUser) {
        try {
          targetUser = await client.users.fetch(userInput);
        } catch {}
      }

      if (!targetUser) {
        return message.channel.send(formatThreeBlock("Barro Stalk", [["Target", "Unknown"]], [["Result", "User not found. Please provide a valid user mention or ID."]]));
      }

      if (!StalkManager.isStalking(targetUser.id)) {
        return message.channel.send(formatThreeBlock("Barro Stalk", [["Target", targetUser.tag]], [["Result", `Not stalking. Use ${client.prefix}stalk list to see all stalked users.`]]));
      }

      const success = StalkManager.stopStalking(targetUser.id);
      if (success) {
        const stats = StalkManager.getStalkStats(targetUser.id);
        await message.channel.send(formatThreeBlock(
          "Barro Stalk",
          [["Target", targetUser.tag], ["Status", "STOPPED"]],
          [["Result", `Stopped stalking. Total events: ${stats ? stats.totalEvents : 0}`]]
        ));
        log(`Stopped stalking user ${targetUser.tag} (${targetUser.id})`, "debug");
      } else {
        await message.channel.send(formatThreeBlock("Barro Stalk", [["Target", targetUser.tag]], [["Result", `Failed to stop stalking ${targetUser.tag}.`]]));
      }
    } catch (error) {
      log(`Error stopping stalk: ${error.message}`, "error");
      message.channel.send(formatThreeBlock("Barro Stalk", [["Status", "Error"]], [["Result", `An error occurred: ${error.message}`]]));
    }
  },

  async listStalkedUsers(client, message) {
    try {
      const stalkedUsers = StalkManager.getStalkedUsers();
      if (stalkedUsers.size === 0) {
        return message.channel.send(formatThreeBlock(
          "Barro Stalk",
          [["Sessions", "0"]],
          [["Result", `No users are currently being stalked. Use ${client.prefix}stalk <@user/userID> to start stalking someone.`]]
        ));
      }

      const rows = [];
      for (const [userId, stalkInfo] of stalkedUsers) {
        const duration = new Date() - stalkInfo.startTime;
        const stats = StalkManager.getStalkStats(userId);
        rows.push([stalkInfo.tag, `${StalkManager.formatDuration(duration)} | ${stats ? stats.totalEvents : 0} events`]);
      }

      const allRows = rows.length ? rows : [["None", "No active stalk sessions"]];
      await message.channel.send(formatThreeBlock("Barro Stalk", [["Sessions", String(stalkedUsers.size)]], allRows));
    } catch (error) {
      log(`Error listing stalked users: ${error.message}`, "error");
      message.channel.send(formatThreeBlock("Barro Stalk", [["Status", "Error"]], [["Result", `An error occurred: ${error.message}`]]));
    }
  },
};

function style(text, colorCode) {
  return `\u001b[${colorCode}m${text}\u001b[0m`;
}

function formatAnsiBlock(lines) {
  return ["> ```ansi", ...lines.map((line) => `> ${line}`), "> ```"].join("\n");
}

function formatThreeBlock(title, block2Rows, block3Rows) {
  const clean = (value) => String(value).replace(/\u001b\[[0-9;]*m/g, '');
  const width = [...block2Rows, ...block3Rows].reduce((max, [label]) => Math.max(max, clean(label).length), 0);
  const renderRows = (rows) => rows.map(([label, value]) => style(clean(label).padEnd(width, ' '), '0;97') + style(' | ', '0;30') + style(clean(value), '0;34'));
  return [
    formatAnsiBlock([style(title, '0;30')]),
    formatAnsiBlock(renderRows(block2Rows)),
    formatAnsiBlock(renderRows(block3Rows))
  ].join('\n');
}
