import { log } from "../../utils/functions.js";
import StalkManager from "../../utils/StalkManager.js";

export default {
  name: "viewstalk",
  description: "View stalk logs for users",
  aliases: ["viewstalking", "stalklogs", "vs"],
  usage: "<@user/userID> | list | <@user/userID> stats",
  category: "troll",
  type: "both",
  permissions: ["SendMessages"],
  cooldown: 30,

  async execute(client, message, args) {
    try {
      if (!args.length) {
        return message.channel.send(formatColoredHeaders(
          `> ❌ **Usage:**\n` +
            `> • \`${client.prefix}viewstalk <@user/userID>\` - View user's stalk logs\n` +
            `> • \`${client.prefix}viewstalk <@user/userID> stats\` - View user's stalk statistics\n` +
            `> • \`${client.prefix}viewstalk list\` - List all stalk files\n` +
            `> \n` +
            `> **Navigation (when viewing logs):**\n` +
            `> • \`${client.prefix}viewstalk next\` - Next page\n` +
            `> • \`${client.prefix}viewstalk prev\` - Previous page\n` +
            `> • \`${client.prefix}viewstalk recent\` - Show recent events\n` +
            `> • \`${client.prefix}viewstalk overview\` - Show overview`
        ));
      }

      const subcommand = args[0].toLowerCase();

      // Check if user has an active viewing session
      const viewTask = client.stalkViewTasks?.get(message.author.id);

      // Handle navigation commands if there's an active viewing session
      if (viewTask) {
        if (subcommand === "next") {
          return this.handleNavigation(client, message, viewTask, "next");
        } else if (subcommand === "prev") {
          return this.handleNavigation(client, message, viewTask, "prev");
        } else if (subcommand === "recent") {
          viewTask.section = "recent";
          viewTask.currentPage = 1;
          return this.showStalkPage(client, message, viewTask);
        } else if (subcommand === "overview") {
          viewTask.section = "overview";
          return this.showStalkPage(client, message, viewTask);
        }
      }

      // Handle list subcommand
      if (subcommand === "list") {
        return this.listStalkFiles(client, message);
      }

      // Handle user-specific commands
      const userInput = args[0];
      const action = args[1]?.toLowerCase();

      if (action === "stats") {
        return this.showUserStats(client, message, userInput);
      }

      // Default: view user logs
      return this.viewUserLogs(client, message, userInput);
    } catch (error) {
      log(`Error in viewstalk command: ${error.message}`, "error");
      message.channel.send(`> ❌ An error occurred: ${error.message}`);
    }
  },

  /**
   * List all stalk files
   */
  async listStalkFiles(client, message) {
    try {
      const stalkFiles = StalkManager.getAllStalkFiles();

      if (stalkFiles.length === 0) {
        return message.channel.send(
          `> 📝 **No stalk files found!**\n` +
            `> Use \`${client.prefix}stalk <@user/userID>\` to start stalking someone.`
        );
      }

      let listText = `> 📋 **Stalk Files (${stalkFiles.length}):**\n\n`;

      for (const file of stalkFiles.slice(0, 15)) {
        // Show first 15 files
        const fileSizeKB = Math.round(file.fileSize / 1024);
        const status = file.isActive
          ? "🟢 Active"
          : file.isEnded
          ? "🔴 Ended"
          : "⚪ Inactive";

        listText += `> **${file.userTag}** (${file.userId})\n`;
        listText += `> • Status: ${status}\n`;
        listText += `> • Started: ${file.startTime.toLocaleString()}\n`;
        listText += `> • Size: ${fileSizeKB}KB\n`;
        listText += `> • View: \`${client.prefix}viewstalk ${file.userId}\`\n\n`;
      }

      if (stalkFiles.length > 15) {
        listText += `> ... and ${stalkFiles.length - 15} more files.\n`;
      }

      listText += `> Use \`${client.prefix}viewstalk <userID>\` to view specific logs.`;

      await message.channel.send(formatColoredHeaders(listText));
    } catch (error) {
      log(`Error listing stalk files: ${error.message}`, "error");
      message.channel.send(`> ❌ An error occurred: ${error.message}`);
    }
  },

  /**
   * Show user statistics
   */
  async showUserStats(client, message, userInput) {
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

      const stats = StalkManager.getStalkStats(targetUser.id);
      if (!stats) {
        return message.channel.send(
          `> ❌ **No stalk data found for ${targetUser.tag}!**\n` +
            `> Use \`${client.prefix}stalk ${targetUser.id}\` to start stalking them.`
        );
      }

      const stalkInfo = StalkManager.getStalkInfo(targetUser.id);
      const isActive = StalkManager.isStalking(targetUser.id);

      let statsText = `> 📊 **Stalk Statistics for ${targetUser.tag}**\n\n`;

      statsText += `> **📈 Activity Summary:**\n`;
      statsText += `> • Messages Sent: ${stats.messagesSent}\n`;
      statsText += `> • Messages Edited: ${stats.messagesEdited}\n`;
      statsText += `> • Messages Deleted: ${stats.messagesDeleted}\n`;
      statsText += `> • Voice Joins: ${stats.voiceJoins}\n`;
      statsText += `> • Voice Leaves: ${stats.voiceLeaves}\n`;
      statsText += `> • Presence Updates: ${stats.presenceUpdates}\n`;
      statsText += `> • **Total Events: ${stats.totalEvents}**\n\n`;

      if (stalkInfo) {
        const duration = new Date() - stalkInfo.startTime;
        statsText += `> **⏱️ Session Info:**\n`;
        statsText += `> • Status: ${isActive ? "🟢 Active" : "🔴 Ended"}\n`;
        statsText += `> • Started: ${stalkInfo.startTime.toLocaleString()}\n`;
        statsText += `> • Duration: ${StalkManager.formatDuration(
          duration
        )}\n\n`;
      }

      statsText += `> Use \`${client.prefix}viewstalk ${targetUser.id}\` to view full logs.`;

      await message.channel.send(formatColoredHeaders(statsText));
    } catch (error) {
      log(`Error showing user stats: ${error.message}`, "error");
      message.channel.send(`> ❌ An error occurred: ${error.message}`);
    }
  },

  /**
   * View user logs with pagination
   */
  async viewUserLogs(client, message, userInput) {
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

      const logContent = StalkManager.readStalkLog(targetUser.id);
      if (!logContent) {
        return message.channel.send(
          `> ❌ **No stalk data found for ${targetUser.tag}!**\n` +
            `> Use \`${client.prefix}stalk ${targetUser.id}\` to start stalking them.`
        );
      }

      // Parse log content into events
      const events = this.parseLogContent(logContent);
      const stats = StalkManager.getStalkStats(targetUser.id);
      const stalkInfo = StalkManager.getStalkInfo(targetUser.id);

      // Create viewing session
      const taskId = `viewstalk_${message.author.id}`;
      const viewTask = {
        id: taskId,
        userId: targetUser.id,
        userTag: targetUser.tag,
        events: events,
        stats: stats,
        stalkInfo: stalkInfo,
        currentPage: 1,
        pageSize: 10,
        section: "overview", // 'overview', 'recent', 'logs'
        message: null,
      };

      // Store the task in client for reference
      if (!client.stalkViewTasks) client.stalkViewTasks = new Map();
      client.stalkViewTasks.set(message.author.id, viewTask);

      // Show the first page (overview)
      await this.showStalkPage(client, message, viewTask);
    } catch (error) {
      log(`Error viewing user logs: ${error.message}`, "error");
      message.channel.send(`> ❌ An error occurred: ${error.message}`);
    }
  },

  /**
   * Handle navigation commands
   */
  async handleNavigation(client, message, viewTask, direction) {
    const totalEvents = viewTask.events.length;
    const totalPages = Math.ceil(totalEvents / viewTask.pageSize);

    if (direction === "next") {
      if (viewTask.currentPage < totalPages) {
        viewTask.currentPage++;
        return this.showStalkPage(client, message, viewTask);
      } else {
        return message.channel.send("> ❌ You're already on the last page.");
      }
    } else if (direction === "prev") {
      if (viewTask.currentPage > 1) {
        viewTask.currentPage--;
        return this.showStalkPage(client, message, viewTask);
      } else {
        return message.channel.send("> ❌ You're already on the first page.");
      }
    }
  },

  /**
   * Show stalk page based on current section
   */
  async showStalkPage(client, message, viewTask) {
    const {
      userId,
      userTag,
      events,
      stats,
      stalkInfo,
      currentPage,
      pageSize,
      section,
    } = viewTask;
    const isActive = StalkManager.isStalking(userId);

    let pageText = "";
    let navigationText = "";

    // Overview section
    if (section === "overview") {
      pageText = `> 👁️ **Stalk Overview: ${userTag}**\n\n`;

      pageText += `> **📊 Statistics:**\n`;
      if (stats) {
        pageText += `> • Messages Sent: ${stats.messagesSent}\n`;
        pageText += `> • Messages Edited: ${stats.messagesEdited}\n`;
        pageText += `> • Messages Deleted: ${stats.messagesDeleted}\n`;
        pageText += `> • Voice Events: ${
          stats.voiceJoins + stats.voiceLeaves
        }\n`;
        pageText += `> • Presence Updates: ${stats.presenceUpdates}\n`;
        pageText += `> • **Total Events: ${stats.totalEvents}**\n\n`;
      }

      if (stalkInfo) {
        const duration = new Date() - stalkInfo.startTime;
        pageText += `> **⏱️ Session Info:**\n`;
        pageText += `> • Status: ${isActive ? "🟢 Active" : "🔴 Ended"}\n`;
        pageText += `> • Started: ${stalkInfo.startTime.toLocaleString()}\n`;
        pageText += `> • Duration: ${StalkManager.formatDuration(
          duration
        )}\n\n`;
      }

      navigationText = `> **📄 Navigation:**\n`;
      navigationText += `> • \`${client.prefix}viewstalk recent\` - View recent events\n`;
      if (isActive) {
        navigationText += `> • \`${client.prefix}stalk stop ${userId}\` - Stop stalking\n`;
      }
    }

    // Recent events section
    else if (section === "recent") {
      const totalEvents = events.length;
      const totalPages = Math.ceil(totalEvents / pageSize);
      const startIdx = (currentPage - 1) * pageSize;
      const endIdx = Math.min(startIdx + pageSize, totalEvents);

      pageText = `> 📝 **Recent Events: ${userTag}** - Page ${currentPage}/${
        totalPages || 1
      }\n\n`;

      if (totalEvents === 0) {
        pageText += `> No events recorded yet.\n\n`;
      } else {
        // Show most recent events first
        const recentEvents = events.slice().reverse().slice(startIdx, endIdx);

        for (const event of recentEvents) {
          pageText += `> **[${event.timestamp}] ${event.type}**\n`;

          if (event.server) pageText += `> Server: ${event.server}\n`;
          if (event.channel) pageText += `> Channel: ${event.channel}\n`;
          if (event.content)
            pageText += `> Content: ${event.content.substring(0, 100)}${
              event.content.length > 100 ? "..." : ""
            }\n`;
          if (event.oldContent)
            pageText += `> Old: ${event.oldContent.substring(0, 50)}${
              event.oldContent.length > 50 ? "..." : ""
            }\n`;
          if (event.newContent)
            pageText += `> New: ${event.newContent.substring(0, 50)}${
              event.newContent.length > 50 ? "..." : ""
            }\n`;
          if (event.details) pageText += `> ${event.details}\n`;

          pageText += `> \n`;
        }
      }

      navigationText = `> **📄 Navigation:**\n`;
      if (currentPage > 1) {
        navigationText += `> • \`${client.prefix}viewstalk prev\` - Previous page\n`;
      }
      if (currentPage < totalPages) {
        navigationText += `> • \`${client.prefix}viewstalk next\` - Next page\n`;
      }
      navigationText += `> • \`${client.prefix}viewstalk overview\` - Return to overview\n`;
    }

    // Combine text and send
    const fullText = pageText + navigationText;

    // Send or edit message
    if (viewTask.message) {
      await viewTask.message.edit(formatColoredHeaders(fullText));
    } else {
      viewTask.message = await message.channel.send(formatColoredHeaders(fullText));
    }
  },

  /**
   * Parse log content into structured events
   */
  parseLogContent(content) {
    const lines = content.split("\n");
    const events = [];
    let currentEvent = null;

    for (const line of lines) {
      // Check for event start
      const eventMatch = line.match(/^\[(.+?)\] (.+)$/);
      if (eventMatch) {
        // Save previous event
        if (currentEvent) {
          events.push(currentEvent);
        }

        // Start new event
        const [, timestamp, eventType] = eventMatch;
        currentEvent = {
          timestamp: timestamp,
          type: eventType,
          server: null,
          channel: null,
          content: null,
          oldContent: null,
          newContent: null,
          details: null,
        };
      } else if (currentEvent && line.trim().startsWith("Server:")) {
        currentEvent.server = line.replace("Server:", "").trim();
      } else if (currentEvent && line.trim().startsWith("Channel:")) {
        currentEvent.channel = line.replace("Channel:", "").trim();
      } else if (currentEvent && line.trim().startsWith("Content:")) {
        currentEvent.content = line.replace("Content:", "").trim();
      } else if (currentEvent && line.trim().startsWith("Old Content:")) {
        currentEvent.oldContent = line.replace("Old Content:", "").trim();
      } else if (currentEvent && line.trim().startsWith("New Content:")) {
        currentEvent.newContent = line.replace("New Content:", "").trim();
      } else if (currentEvent && line.trim().startsWith("Joined:")) {
        currentEvent.details = `Joined: ${line.replace("Joined:", "").trim()}`;
      } else if (currentEvent && line.trim().startsWith("Left:")) {
        currentEvent.details = `Left: ${line.replace("Left:", "").trim()}`;
      } else if (currentEvent && line.trim().startsWith("Status:")) {
        currentEvent.details = `Status: ${line.replace("Status:", "").trim()}`;
      }
    }

    // Add last event
    if (currentEvent) {
      events.push(currentEvent);
    }

    return events;
  },
};

function style(text, colorCode) {
  return `\u001b[${colorCode}m${text}\u001b[0m`;
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

  return ["> ```ansi", ...lines.map((line) => `> ${line}`), "> ```"].join("\n");
}
