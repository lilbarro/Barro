import TaskManager from "../../utils/TaskManager.js";
import { log } from "../../utils/functions.js";

// Store active clownify sessions - will be accessible from messageCreate event
export const clownifySessions = new Map();

export default {
  name: "clownify",
  aliases: ["clown", "makeclown"],
  description: "React with clown emoji to every message from a user",
  usage:
    "clownify <@user/user_id> | clownify stop <@user/user_id> | clownify list",
  category: "fun",
  type: "both",
  permissions: ["SendMessages", "AddReactions"],
  cooldown: 5,

  async execute(client, message, args) {
    if (!args.length) {
      return message.channel.send(
        "❌ **Please specify a command!**\n" +
          `**Usage:**\n` +
          `• \`${client.prefix}clownify @user\` - Start clownifying\n` +
          `• \`${client.prefix}clownify stop @user\` - Stop clownifying\n` +
          `• \`${client.prefix}clownify list\` - Show active sessions`
      );
    }

    const subcommand = args[0].toLowerCase();

    // Handle subcommands
    if (subcommand === "stop" || subcommand === "end") {
      return this.stopClownify(client, message, args.slice(1));
    }

    if (subcommand === "list" || subcommand === "active") {
      return this.listActive(client, message);
    }

    // Default: start clownifying a user
    return this.startClownify(client, message, args);
  },

  async startClownify(client, message, args) {
    let targetUser = null;

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
          "❌ **User not found!** Please mention a valid user or provide a valid user ID."
        );
      }
    }

    if (!targetUser) {
      return message.channel.send(
        "❌ **Please specify a user to clownify!**\n" +
          `**Usage:** \`${client.prefix}clownify @user\``
      );
    }

    // Prevent self-clownifying
    if (targetUser.id === message.author.id) {
      return message.channel.send("🤡 **You can't clownify yourself!**");
    }

    // Prevent clownifying bots
    if (targetUser.bot) {
      return message.channel.send("🤖 **Can't clownify bots!**");
    }

    const guildId = message.guild?.id || "dm";
    const sessionKey = `${targetUser.id}:${guildId}`;

    // Check if user is already being clownified
    if (clownifySessions.has(sessionKey)) {
      return message.channel.send(
        `🤡 **${targetUser.username} is already being clownified!**`
      );
    }

    // Create task using TaskManager
    const taskName = `clownify_${targetUser.id}`;
    const task = TaskManager.createTask(taskName, guildId);

    if (!task) {
      return message.channel.send("❌ **Failed to create clownify task!**");
    }

    // Store session data
    const sessionData = {
      targetUserId: targetUser.id,
      targetUsername: targetUser.username,
      guildId: guildId,
      startedBy: message.author.id,
      startedAt: Date.now(),
      messageCount: 0,
      task: task,
      isCancelled: false,
    };

    // Add cancellation listener to clean up session immediately
    if (task.signal) {
      task.signal.addEventListener("abort", () => {
        sessionData.isCancelled = true;
        clownifySessions.delete(sessionKey);
        // Only log if it was actually cancelled by user, not by natural completion
        if (!task.signal.reason || task.signal.reason !== "completed") {
          log(`Clownify task for ${targetUser.username} was cancelled`, "warn");
        }
      });
    }

    clownifySessions.set(sessionKey, sessionData);

    await message.channel.send(
      `🤡 **Started clownifying ${targetUser.username}!**\n` +
        `Every message they send will get a clown reaction.`
    );

    log(
      `Started clownifying ${targetUser.username} (${targetUser.id}) in ${guildId}`,
      "debug"
    );
  },

  async stopClownify(client, message, args) {
    let targetUser = null;

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
        return message.channel.send("❌ **User not found!**");
      }
    }

    if (!targetUser) {
      return message.channel.send(
        "❌ **Please specify which user to stop clownifying!**"
      );
    }

    const guildId = message.guild?.id || "dm";
    const sessionKey = `${targetUser.id}:${guildId}`;

    if (!clownifySessions.has(sessionKey)) {
      return message.channel.send(
        `❌ **${targetUser.username} is not being clownified!**`
      );
    }

    const sessionData = clownifySessions.get(sessionKey);
    const duration = Date.now() - sessionData.startedAt;
    const durationText = this.formatDuration(duration);

    // Stop the task and remove session
    if (sessionData.task) {
      sessionData.task.stop();
    }
    clownifySessions.delete(sessionKey);

    await message.channel.send(
      `✅ **Stopped clownifying ${targetUser.username}!**\n` +
        `**Duration:** ${durationText}\n` +
        `**Messages clownified:** ${sessionData.messageCount}`
    );

    log(
      `Stopped clownifying ${targetUser.username} (${targetUser.id})`,
      "debug"
    );
  },

  async listActive(client, message) {
    const guildId = message.guild?.id || "dm";
    const activeSessions = Array.from(clownifySessions.entries()).filter(
      ([key, data]) => data.guildId === guildId
    );

    if (activeSessions.length === 0) {
      return message.channel.send("📝 **No active clownify sessions!**");
    }

    let listText = "🤡 **Active Clownify Sessions:**\n\n";

    for (const [sessionKey, data] of activeSessions) {
      const duration = Date.now() - data.startedAt;
      const durationText = this.formatDuration(duration);

      listText += `**${data.targetUsername}**\n`;
      listText += `• Duration: ${durationText}\n`;
      listText += `• Messages clownified: ${data.messageCount}\n\n`;
    }

    await message.channel.send(listText);
  },

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
