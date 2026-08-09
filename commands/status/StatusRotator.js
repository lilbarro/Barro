import axios from "axios";
import { log, loadConfig } from "../../utils/functions.js";
import TaskManager from "../../utils/TaskManager.js";

// Store active status rotation sessions
const statusRotationSessions = new Map();

export default {
  name: "statusrotator",
  description: "Rotate between multiple custom statuses automatically",
  aliases: ["sr", "rotatestatus", "statusrot"],
  usage: "{status1} {status2} {status3} | sr stop | sr list",
  category: "status",
  type: "both",
  permissions: ["SendMessages"],
  cooldown: 5,

  async execute(client, message, args) {
    if (!args.length) {
      return message.channel.send(
        "> ❌ **Please specify a command!**\n" +
          `**Usage:**\n` +
          `• \`${client.prefix}sr {status1} {status2} {status3}\` - Start status rotation\n` +
          `• \`${client.prefix}sr stop\` - Stop status rotation\n` +
          `• \`${client.prefix}sr list\` - Show current rotation\n\n` +
          `**Examples:**\n` +
          `• \`${client.prefix}sr {🎮 Gaming} {📚 Studying} {😴 Sleeping}\`\n` +
          `• \`${client.prefix}sr {⭐ Coding} {🎵 Listening to music}\``
      );
    }

    const subcommand = args.join(" ").toLowerCase();

    // Handle subcommands
    if (subcommand === "stop" || subcommand === "end") {
      return this.stopStatusRotation(client, message);
    }

    if (subcommand === "list" || subcommand === "show") {
      return this.showCurrentRotation(client, message);
    }

    // Default: start status rotation
    return this.startStatusRotation(client, message, args);
  },

  async startStatusRotation(client, message, args) {
    // Parse statuses from curly brackets
    const input = args.join(" ");
    const statusMatches = input.match(/\{([^}]+)\}/g);

    if (!statusMatches || statusMatches.length < 2) {
      return message.channel.send(
        "> ❌ **Please provide at least 2 statuses in curly brackets!**\n" +
          `> **Example:** \`${client.prefix}sr {🎮 Gaming} {📚 Studying} {😴 Sleeping}\``
      );
    }

    // Extract status texts
    const statuses = statusMatches.map((match) => match.slice(1, -1).trim());

    // Validate statuses
    const validatedStatuses = [];
    for (const status of statuses) {
      const parsed = this.parseStatus(status);
      if (parsed.text.length > 128) {
        return message.channel.send(
          `> ❌ **Status too long:** "${parsed.text}"\n` +
            `> Maximum length is 128 characters.`
        );
      }
      validatedStatuses.push(parsed);
    }

    const userId = message.author.id;

    // Check if rotation is already active
    if (statusRotationSessions.has(userId)) {
      return message.channel.send(
        "> ⚠️ **Status rotation is already active!** Use `sr stop` to stop it first."
      );
    }

    // Create task using TaskManager
    const taskName = `status_rotation_${userId}`;
    const task = TaskManager.createTask(taskName, "global");

    if (!task) {
      return message.channel.send(
        "> ❌ **Failed to create status rotation task!**"
      );
    }

    try {
      // Test the first status to ensure API works
      await this.setCustomStatus(client, validatedStatuses[0]);

      // Store session data
      const sessionData = {
        userId: userId,
        statuses: validatedStatuses,
        currentIndex: 0,
        startedAt: Date.now(),
        rotationCount: 0,
        task: task,
        intervalId: null,
        isCancelled: false,
      };

      // Add cancellation listener to clean up session immediately
      if (task.signal) {
        task.signal.addEventListener("abort", () => {
          sessionData.isCancelled = true;
          if (sessionData.intervalId) {
            clearTimeout(sessionData.intervalId);
          }
          statusRotationSessions.delete(userId);
          // Only log if it was actually cancelled by user, not by natural completion
          if (!task.signal.reason || task.signal.reason !== "completed") {
            log(
              `Status rotation task for ${message.author.tag} was cancelled`,
              "warn"
            );
          }
        });
      }

      statusRotationSessions.set(userId, sessionData);

      // Start rotation interval
      this.startRotationInterval(client, sessionData);

      await message.channel.send(
        `> ✅ **Status rotation started!**\n` +
          `> 🔄 **Statuses:** ${validatedStatuses.length}\n` +
          `> ⏱️ **Interval:** 60-180 seconds\n` +
          `> 📝 **Current:** ${validatedStatuses[0].display}\n\n` +
          `**Rotation List:**\n` +
          validatedStatuses.map((s, i) => `${i + 1}. ${s.display}`).join("\n")
      );

      log(
        `Started status rotation for ${message.author.tag} with ${validatedStatuses.length} statuses`,
        "debug"
      );
    } catch (error) {
      // Clean up task if setup fails
      task.stop();
      log(`Error starting status rotation: ${error.message}`, "error");
      return message.channel.send(
        `> ❌ **Failed to start status rotation:** ${error.message}`
      );
    }
  },

  async stopStatusRotation(client, message) {
    const userId = message.author.id;

    if (!statusRotationSessions.has(userId)) {
      return message.channel.send("> ❌ **No active status rotation found!**");
    }

    const sessionData = statusRotationSessions.get(userId);
    const duration = Date.now() - sessionData.startedAt;
    const durationText = this.formatDuration(duration);

    // Clear interval and stop task
    if (sessionData.intervalId) {
      clearInterval(sessionData.intervalId);
    }
    if (sessionData.task) {
      sessionData.task.stop();
    }

    // Remove session
    statusRotationSessions.delete(userId);

    await message.channel.send(
      `> ✅ **Status rotation stopped!**\n` +
        `> ⏱️ **Duration:** ${durationText}\n` +
        `> 🔄 **Total rotations:** ${sessionData.rotationCount}`
    );

    log(`Stopped status rotation for ${message.author.tag}`, "debug");
  },

  async showCurrentRotation(client, message) {
    const userId = message.author.id;

    if (!statusRotationSessions.has(userId)) {
      return message.channel.send("> 📝 **No active status rotation!**");
    }

    const sessionData = statusRotationSessions.get(userId);
    const duration = Date.now() - sessionData.startedAt;
    const durationText = this.formatDuration(duration);
    const currentStatus = sessionData.statuses[sessionData.currentIndex];

    let listText = `> 🔄 **Active Status Rotation**\n\n`;
    listText += `> ⏱️ **Running for:** ${durationText}\n`;
    listText += `> 🔄 **Total rotations:** ${sessionData.rotationCount}\n`;
    listText += `> 📝 **Current:** ${currentStatus.display}\n\n`;
    listText += `**Rotation List:**\n`;

    sessionData.statuses.forEach((status, index) => {
      const indicator = index === sessionData.currentIndex ? "➤" : " ";
      listText += `${indicator} ${index + 1}. ${status.display}\n`;
    });

    await message.channel.send(listText);
  },

  /**
   * Start the rotation interval for a session
   * @param {Client} client - Discord client
   * @param {Object} sessionData - Session data object
   */
  startRotationInterval(client, sessionData) {
    const rotateStatus = async () => {
      try {
        // Check if task was cancelled
        if (sessionData.task.signal.aborted || sessionData.isCancelled) return;

        // Move to next status
        sessionData.currentIndex =
          (sessionData.currentIndex + 1) % sessionData.statuses.length;
        sessionData.rotationCount++;

        const nextStatus = sessionData.statuses[sessionData.currentIndex];
        await this.setCustomStatus(client, nextStatus);

        log(`Rotated status to: ${nextStatus.display}`, "debug");

        // Check again before scheduling next rotation
        if (sessionData.task.signal.aborted || sessionData.isCancelled) return;

        // Schedule next rotation with random interval (60-180 seconds)
        const nextInterval =
          Math.floor(Math.random() * (180000 - 60000 + 1)) + 60000;

        sessionData.intervalId = setTimeout(rotateStatus, nextInterval);

        // Add cancellation listener to the timeout
        if (sessionData.task.signal) {
          sessionData.task.signal.addEventListener("abort", () => {
            if (sessionData.intervalId) {
              clearTimeout(sessionData.intervalId);
            }
          });
        }
      } catch (error) {
        if (
          sessionData.task.signal.aborted ||
          error.message.includes("cancelled")
        )
          return;

        log(`Error rotating status: ${error.message}`, "error");

        // Stop rotation on error
        if (statusRotationSessions.has(sessionData.userId)) {
          const session = statusRotationSessions.get(sessionData.userId);
          if (session.task) {
            session.task.stop();
          }
          statusRotationSessions.delete(sessionData.userId);
        }
      }
    };

    // Start first rotation after random interval
    const initialInterval =
      Math.floor(Math.random() * (180000 - 60000 + 1)) + 60000;
    sessionData.intervalId = setTimeout(rotateStatus, initialInterval);

    // Add cancellation listener to the initial timeout
    if (sessionData.task.signal) {
      sessionData.task.signal.addEventListener("abort", () => {
        if (sessionData.intervalId) {
          clearTimeout(sessionData.intervalId);
        }
      });
    }
  },

  /**
   * Parse status text and extract emoji/text
   * @param {string} statusText - Raw status text
   * @returns {Object} Parsed status object
   */
  parseStatus(statusText) {
    // Check for custom emoji pattern <:name:id> or <a:name:id>
    const customEmojiMatch = statusText.match(/^<a?:(\w+):(\d+)>\s*(.*)/);
    if (customEmojiMatch) {
      const [, name, id, text] = customEmojiMatch;
      return {
        emoji: {
          name: name,
          id: id,
          animated: statusText.startsWith("<a:"),
        },
        text: text.trim(),
        display: `<${
          statusText.startsWith("<a:") ? "a" : ""
        }:${name}:${id}> ${text.trim()}`,
      };
    }

    // Check for unicode emoji at the start
    const unicodeEmojiMatch = statusText.match(
      /^([\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])\s*(.*)/u
    );
    if (unicodeEmojiMatch) {
      const [, emoji, text] = unicodeEmojiMatch;
      return {
        emoji: {
          name: emoji,
        },
        text: text.trim(),
        display: `${emoji} ${text.trim()}`,
      };
    }

    // No emoji, just text
    return {
      emoji: null,
      text: statusText.trim(),
      display: statusText.trim(),
    };
  },

  /**
   * Set custom status using Discord API
   * @param {Client} client - Discord client
   * @param {Object} statusData - Parsed status data
   */
  async setCustomStatus(client, statusData) {
    try {
      const config = loadConfig();
      const apiVersion = config.api?.version || "v10";

      const payload = {
        custom_status: {
          text: statusData.text || null,
          emoji_name: statusData.emoji?.name || null,
          emoji_id: statusData.emoji?.id || null,
          expires_at: null,
        },
      };

      const response = await axios.patch(
        `https://discord.com/api/${apiVersion}/users/@me/settings`,
        payload,
        {
          headers: {
            Authorization: client.token,
            "Content-Type": "application/json",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        }
      );

      if (response.status !== 200) {
        throw new Error(`API returned status ${response.status}`);
      }
    } catch (error) {
      if (error.response) {
        throw new Error(
          `API Error ${error.response.status}: ${error.response.statusText}`
        );
      } else {
        throw new Error(`Network Error: ${error.message}`);
      }
    }
  },

  /**
   * Format duration in milliseconds to readable string
   * @param {number} ms - Duration in milliseconds
   * @returns {string} Formatted duration
   */
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  },
};

// Export sessions for cleanup on shutdown
export { statusRotationSessions };
