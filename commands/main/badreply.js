import { log, loadConfig } from "../../utils/functions.js";
import TaskManager from "../../utils/TaskManager.js";

// Store active bad reply sessions
const badReplySessions = new Map();

// Default bad replies (fallback if config is not available)
const defaultBadReplies = [
  "You're such a pathetic loser, go touch some grass you basement dweller.",
  "Shut the hell up, nobody asked for your stupid opinion you moron.",
  "You're absolutely worthless, a complete waste of oxygen and space.",
  "Go f*ck yourself, you annoying piece of sh*t nobody likes you.",
  "You're a braindead idiot who should just delete your account already.",
  "Stop being such a dumbass, your stupidity is showing again.",
  "You're the most annoying b*tch I've ever encountered online.",
  "Seriously, just shut your mouth you ignorant fool.",
  "You're a complete failure at life, go cry to your mommy.",
  "Nobody cares about what you have to say, you're irrelevant.",
  "You're such a cringe loser, get a life outside the internet.",
  "Stop embarrassing yourself, you look like a total clown.",
  "You're absolutely disgusting, both inside and out you freak.",
  "Go away you toxic piece of garbage, nobody wants you here.",
  "You're the definition of human trash, completely worthless.",
  "Shut up you annoying brat, adults are talking here.",
  "You're such a pathetic virgin, go outside and touch grass.",
  "Stop being such a drama queen, you attention-seeking wh*re.",
  "You're completely braindead, use your brain for once idiot.",
  "Nobody likes you, you're just an annoying pest that won't go away.",
];

/**
 * Get bad replies from config or use defaults
 * @returns {Array} Array of bad reply phrases
 */
function getBadReplies() {
  try {
    const config = loadConfig();

    // Check if bad_phrases is configured and enabled
    if (
      config.bad_phrases &&
      config.bad_phrases.enabled &&
      config.bad_phrases.phrases &&
      config.bad_phrases.phrases.length > 0
    ) {
      log("Using bad phrases from config", "debug");
      return config.bad_phrases.phrases.slice(0, 30);
    } else {
      log("Using default bad phrases (config not found or disabled)", "debug");
      return defaultBadReplies.slice(0, 30);
    }
  } catch (error) {
    log(`Error loading bad phrases from config: ${error.message}`, "warn");
    return defaultBadReplies.slice(0, 30);
  }
}

export default {
  name: "badreply",
  description: "Auto-reply with bad words to a specific user",
  aliases: ["br", "toxicreply", "badword"],
  usage: "<@user/user_id> | badreply stop <@user/user_id> | badreply list",
  category: "troll",
  type: "both",
  permissions: ["SendMessages"],
  cooldown: 5,

  async execute(client, message, args) {
    if (!args.length) {
      const lines = [
        style('═════════ BADREPLY HELP ═════════', '0;30'),
        '',
        style('USAGE:', '1;31'),
        style(`  ${client.prefix}badreply @user`, '0;97'),
        style(`  ${client.prefix}badreply stop @user`, '0;97'),
        style(`  ${client.prefix}badreply list`, '0;97'),
      ];
      return message.channel.send(formatAnsiBlock(lines));
    }

    const subcommand = args[0].toLowerCase();

    // Handle subcommands
    if (subcommand === "stop" || subcommand === "end") {
      return this.stopBadReply(client, message, args.slice(1));
    }

    if (subcommand === "list" || subcommand === "active") {
      return this.listActive(client, message);
    }

    // Default: start bad replying to a user
    return this.startBadReply(client, message, args);
  },

  async startBadReply(client, message, args) {
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
        return message.channel.send(formatAnsiBlock([style('> ❌ User not found! Please mention a valid user or provide a valid user ID.', '1;91')]));
      }
    }

    if (!targetUser) {
      return message.channel.send(formatAnsiBlock([style('> ❌ Please specify a user to bad reply to!', '1;91'), '', style(`Usage: ${client.prefix}badreply @user`, '0;97')]));
    }

    // Prevent self-targeting
    if (targetUser.id === message.author.id) {
      return message.channel.send("🤡 **You can't bad reply to yourself!**");
    }

    // Prevent targeting bots
    if (targetUser.bot) {
      return message.channel.send(formatAnsiBlock([style('> 🤖 Cannot bad reply to bot accounts.', '1;91')]));
    }

    const guildId = message.guild?.id || "dm";
    const sessionKey = `${targetUser.id}:${guildId}`;

    // Check if user is already being bad replied to
    if (badReplySessions.has(sessionKey)) {
      return message.channel.send(
        `💀 **${targetUser.username} is already being bad replied to!**`
      );
    }

    // Create task using TaskManager
    const taskName = `badreply_${targetUser.id}`;
    const task = TaskManager.createTask(taskName, guildId);

    if (!task) {
      return message.channel.send(formatAnsiBlock([style('> ❌ Failed to create bad reply task!', '1;91')]));
    }

    // Store session data
    const sessionData = {
      targetUserId: targetUser.id,
      targetUsername: targetUser.username,
      guildId: guildId,
      channelId: message.channel.id,
      startedBy: message.author.id,
      startedAt: Date.now(),
      replyCount: 0,
      task: task,
      isCancelled: false,
    };

    // Add cancellation listener to clean up session immediately
    if (task.signal) {
      task.signal.addEventListener("abort", () => {
        sessionData.isCancelled = true;
        badReplySessions.delete(sessionKey);
        // Only log if it was actually cancelled by user, not by natural completion
        if (!task.signal.reason || task.signal.reason !== "completed") {
          log(
            `Bad reply task for ${targetUser.username} was cancelled`,
            "warn"
          );
        }
      });
    }

    // Store session under the specific guild/DM key
    badReplySessions.set(sessionKey, sessionData);
    // Also store a global session key so mocking works across guilds/DMs
    const globalKey = `${targetUser.id}:global`;
    badReplySessions.set(globalKey, sessionData);

    // Also register a dedicated listener for this target to ensure replies
    try {
      const messageListener = async (msg) => {
        try {
          if (!msg) return;
          if (msg.author?.id !== targetUser.id) return;
          if (msg.author.bot) return;

          // Avoid replying to messages not visible to the bot
              const replies = getBadReplies();
              const mocked = replies[Math.floor(Math.random() * replies.length)];
              await msg.reply(mocked);
          sessionData.replyCount++;
          console.log(`[badreply] listener replied to ${msg.author.id} in ${msg.guild?.id || 'dm'}`);
        } catch (err) {
          console.log('[badreply] listener error:', err?.message || err);
        }
      };

      // Attach the listener to the client (global)
      client.on('messageCreate', messageListener);
      sessionData.listener = messageListener;
    } catch (e) {
      // ignore listener attach failures
    }

    const startLines = [
      style('═════════ BADREPLY ACTIVE ═════════', '0;30'),
      '',
      style('> STATUS :', '1;31') + ' ' + style('ACTIVE', '0;97'),
      style('> TARGET :', '1;31') + ' ' + style(`${targetUser.username} (${targetUser.id})`, '0;97'),
      '',
      style('Every message they send will receive a mock reply.', '0;97')
    ];
    await message.channel.send(formatAnsiBlock(startLines));

    // Debug: print session info to terminal so we can verify matching
    try {
      console.log(`[badreply] session started: key=${sessionKey} target=${targetUser.id} guild=${guildId} task=${taskName}`);
      console.log(`[badreply] active sessions count: ${badReplySessions.size}`);
    } catch (e) {
      // ignore
    }

    log(
      `Started bad replying to ${targetUser.username} (${targetUser.id}) in ${guildId}`,
      "debug"
    );
  },

  async stopBadReply(client, message, args) {
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
        "❌ **Please specify which user to stop bad replying to!**"
      );
    }

    const guildId = message.guild?.id || "dm";
    const sessionKey = `${targetUser.id}:${guildId}`;
    const globalKey = `${targetUser.id}:global`;

    let sessionData = null;
    let usedKey = null;

    if (badReplySessions.has(sessionKey)) {
      sessionData = badReplySessions.get(sessionKey);
      usedKey = sessionKey;
    } else if (badReplySessions.has(globalKey)) {
      sessionData = badReplySessions.get(globalKey);
      usedKey = globalKey;
    } else {
      return message.channel.send(
        `❌ **${targetUser.username} is not being bad replied to!**`
      );
    }
    const duration = Date.now() - sessionData.startedAt;
    const durationText = this.formatDuration(duration);

    // Stop the task and remove session
    if (sessionData.task) {
      sessionData.task.stop();
    }
    // Remove both specific and global keys
    badReplySessions.delete(sessionKey);
    badReplySessions.delete(globalKey);

    // Remove any attached listener
    try {
      if (sessionData.listener && client && typeof client.off === 'function') {
        client.off('messageCreate', sessionData.listener);
      }
    } catch (e) {}

    const stopLines = [
      style('═════════ BADREPLY STOPPED ═════════', '0;30'),
      '',
      style('> TARGET :', '1;31') + ' ' + style(`${targetUser.username} (${targetUser.id})`, '0;97'),
      style('> DURATION :', '1;31') + ' ' + style(durationText, '0;97'),
      style('> REPLIES :', '1;31') + ' ' + style(String(sessionData.replyCount), '0;97'),
    ];
    await message.channel.send(formatAnsiBlock(stopLines));

    log(
      `Stopped bad replying to ${targetUser.username} (${targetUser.id})`,
      "debug"
    );
  },

  async listActive(client, message) {
    const guildId = message.guild?.id || "dm";
    const activeSessions = Array.from(badReplySessions.entries()).filter(
      ([key, data]) => data.guildId === guildId
    );

    if (activeSessions.length === 0) {
      return message.channel.send(formatAnsiBlock([style('📝 No active bad reply sessions!', '0;97')]));
    }

    const listLines = [style('═════════ ACTIVE BADREPLY SESSIONS ═════════', '0;30'), ''];
    for (const [sessionKey, data] of activeSessions) {
      const duration = Date.now() - data.startedAt;
      const durationText = this.formatDuration(duration);
      listLines.push(style(`• ${data.targetUsername} (${data.targetUserId}) - ${durationText} - replies: ${data.replyCount}`, '0;97'));
    }

    await message.channel.send(formatAnsiBlock(listLines));
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

function style(text, colorCode) {
  return `\u001b[${colorCode}m${text}\u001b[0m`;
}

function formatAnsiBlock(lines) {
  return ['> ```ansi', ...lines.map((line) => `> ${line}`), '> ```'].join('\n');
}

// Export the sessions map and getBadReplies function so they can be accessed from messageCreate event
export { badReplySessions, getBadReplies };
