import { log, loadConfig } from "../../utils/functions.js";
import TaskManager from "../../utils/TaskManager.js";

const badReplySessions = new Map();

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

function getBadReplies() {
  try {
    const config = loadConfig();
    if (config.bad_phrases?.enabled && Array.isArray(config.bad_phrases?.phrases) && config.bad_phrases.phrases.length > 0) {
      log("Using bad phrases from config", "debug");
      return config.bad_phrases.phrases.slice(0, 30);
    }
    log("Using default bad phrases (config not found or disabled)", "debug");
    return defaultBadReplies.slice(0, 30);
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
  cooldown: 30,

  async execute(client, message, args) {
    if (!args.length) {
      return message.channel.send(formatThreeBlock(
        "Barro v1.5 Badreply",
        [
          [style("Usage", "0;30"), style(`${client.prefix}badreply @user`, "0;97")],
          [style("Stop", "0;30"), style(`${client.prefix}badreply stop @user`, "0;97")],
          [style("List", "0;30"), style(`${client.prefix}badreply list`, "0;97")]
        ],
        [
          [style("Info", "0;30"), style("Auto-reply with bad words to a specific user.", "0;97")]
        ]
      ));
    }

    const subcommand = args[0].toLowerCase();
    if (subcommand === "stop" || subcommand === "end") return this.stopBadReply(client, message, args.slice(1));
    if (subcommand === "list" || subcommand === "active") return this.listActive(client, message);
    return this.startBadReply(client, message, args);
  },

  async startBadReply(client, message, args) {
    let targetUser = null;
    if (message.mentions.users.size > 0) {
      targetUser = message.mentions.users.first();
    } else if (args[0]) {
      try {
        const userId = args[0].replace(/[<@!>]/g, "");
        if (/^\d+$/.test(userId)) targetUser = await client.users.fetch(userId);
      } catch {
        return message.channel.send(formatThreeBlock("Barro Badreply", [[style("Target", "0;30"), style("Unknown", "0;97")]], [[style("Result", "0;30"), style("User not found.", "0;97")]]));
      }
    }

    if (!targetUser) {
      return message.channel.send(formatThreeBlock("Barro Badreply", [[style("Target", "0;30"), style("Unknown", "0;97")]], [[style("Result", "0;30"), style(`Usage: ${client.prefix}badreply @user`, "0;97")]]));
    }
    if (targetUser.id === message.author.id) {
      return message.channel.send(formatThreeBlock("Barro Badreply", [[style("Target", "0;30"), style(targetUser.username, "0;97")]], [[style("Result", "0;30"), style("You can't bad reply to yourself!", "0;97")]]));
    }
    if (targetUser.bot) {
      return message.channel.send(formatThreeBlock("Barro Badreply", [[style("Target", "0;30"), style(targetUser.username, "0;97")]], [[style("Result", "0;30"), style("Cannot bad reply to bot accounts.", "0;97")]]));
    }

    const guildId = message.guild?.id || "dm";
    const sessionKey = `${targetUser.id}:${guildId}`;
    if (badReplySessions.has(sessionKey)) {
      return message.channel.send(formatThreeBlock("Barro Badreply", [[style("Target", "0;30"), style(targetUser.username, "0;97")]], [[style("Result", "0;30"), style("That user is already being bad replied to!", "0;97")]]));
    }

    const task = TaskManager.createTask(`badreply_${targetUser.id}`, guildId);
    if (!task) {
      return message.channel.send(formatThreeBlock("Barro Badreply", [[style("Target", "0;30"), style(targetUser.username, "0;97")]], [[style("Result", "0;30"), style("Failed to create bad reply task!", "0;97")]]));
    }

    const sessionData = {
      targetUserId: targetUser.id,
      targetUsername: targetUser.username,
      guildId,
      channelId: message.channel.id,
      startedBy: message.author.id,
      startedAt: Date.now(),
      replyCount: 0,
      task,
      isCancelled: false,
      lastReplyAt: 0,
      replyCooldownMs: 1000,
    };

    if (task.signal) {
      task.signal.addEventListener("abort", () => {
        sessionData.isCancelled = true;
        badReplySessions.delete(sessionKey);
        if (!task.signal.reason || task.signal.reason !== "completed") {
          log(`Bad reply task for ${targetUser.username} was cancelled`, "warn");
        }
      });
    }

    badReplySessions.set(sessionKey, sessionData);
    badReplySessions.set(`${targetUser.id}:global`, sessionData);

    const messageListener = async (msg) => {
      try {
        if (!msg || msg.author?.id !== targetUser.id || msg.author.bot) return;
        const now = Date.now();
        if (now - sessionData.lastReplyAt < sessionData.replyCooldownMs) return;
        sessionData.lastReplyAt = now;
        const replies = getBadReplies();
        await msg.reply(replies[Math.floor(Math.random() * replies.length)]);
        sessionData.replyCount++;
      } catch {}
    };
    client.on('messageCreate', messageListener);
    sessionData.listener = messageListener;

    await message.channel.send(formatThreeBlock(
      "Barro Badreply",
      [
        [style("Target", "0;30"), style(`${targetUser.username} (${targetUser.id})`, "0;97")],
        [style("Status", "0;30"), style("ACTIVE", "0;97")]
      ],
      [[style("Result", "0;30"), style("Every message they send will receive a mock reply.", "0;97")]]
    ));
    log(`Started bad replying to ${targetUser.username} (${targetUser.id}) in ${guildId}`, "debug");
  },

  async stopBadReply(client, message, args) {s
    let targetUser = null;
    if (message.mentions.users.size > 0) targetUser = message.mentions.users.first();
    else if (args[0]) {
      try {
        const userId = args[0].replace(/[<@!>]/g, "");
        if (/^\d+$/.test(userId)) targetUser = await client.users.fetch(userId);
      } catch {
        return message.channel.send(formatThreeBlock("Barro Badreply", [[style("Target", "0;30"), style("Unknown", "0;97")]], [[style("Result", "0;30"), style("User not found!", "0;97")]]));
      }
    }
    if (!targetUser) {
      return message.channel.send(formatThreeBlock("Barro Badreply", [[style("Target", "0;30"), style("Unknown", "0;97")]], [[style("Result", "0;30"), style("Please specify which user to stop bad replying to!", "0;97")]]));
    }

    const guildId = message.guild?.id || "dm";
    const sessionKey = `${targetUser.id}:${guildId}`;
    const globalKey = `${targetUser.id}:global`;
    const sessionData = badReplySessions.get(sessionKey) || badReplySessions.get(globalKey);
    if (!sessionData) {
      return message.channel.send(formatThreeBlock("Barro Badreply", [[style("Target", "0;30"), style(targetUser.username, "0;97")]], [[style("Result", "0;30"), style("That user is not being bad replied to!", "0;97")]]));
    }

    if (sessionData.task) sessionData.task.stop();
    badReplySessions.delete(sessionKey);
    badReplySessions.delete(globalKey);
    try {
      if (sessionData.listener && typeof client.off === 'function') client.off('messageCreate', sessionData.listener);
    } catch {}

    const durationText = this.formatDuration(Date.now() - sessionData.startedAt);
    await message.channel.send(formatThreeBlock(
      "Barro Badreply",
      [
        [style("Target", "0;30"), style(`${targetUser.username} (${targetUser.id})`, "0;97")],
        [style("Duration", "0;30"), style(durationText, "0;97")],
        [style("Replies", "0;30"), style(String(sessionData.replyCount), "0;97")]
      ],
      [[style("Result", "0;30"), style("Badreply stopped.", "0;97")]]
    ));
  },

  async listActive(client, message) {
    const guildId = message.guild?.id || "dm";
    const activeSessions = Array.from(badReplySessions.values()).filter(data => data.guildId === guildId);
    if (activeSessions.length === 0) {
      return message.channel.send(formatThreeBlock("Barro Badreply", [[style("Sessions", "0;30"), style("0", "0;97")]], [[style("Result", "0;30"), style("No active bad reply sessions!", "0;97")]]));
    }

    const sessionRows = activeSessions.map(data => [
      style(data.targetUsername, "0;97"),
      style(`${this.formatDuration(Date.now() - data.startedAt)} | ${data.replyCount} replies`, "0;97")
    ]);
    const body = [
      formatAnsiBlock([style("Barro", "4;30")]),([style("Badreply", "0;30")]),
      formatAnsiBlock([style("Active sessions", "0;30"), ...sessionRows.flatMap(r => [r[0], r[1]])]),
      formatAnsiBlock([style("Result", "0;30"), style(`${activeSessions.length} active session(s)`, "0;97")])
    ].join('\n');
    await message.channel.send(body);
  },

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  },
};

function style(text, colorCode) {
  return `\u001b[${colorCode}m${text}\u001b[0m`;
}

function formatAnsiBlock(lines) {
  return ['> ```ansi', ...lines.map(line => `> ${line}`), '> ```'].join('\n');
}

function formatThreeBlock(title, block2Rows, block3Rows) {
  const clean = (value) => String(value).replace(/\u001b\[[0-9;]*m/g, '');
  const width = [...block2Rows, ...block3Rows].reduce((max, [label]) => Math.max(max, clean(label).length), 0);
  const renderRows = (rows) => rows.map(([label, value]) => {
    const left = clean(label).padEnd(width, ' ');
    return style(left, '0;97') + style(' | ', '0;30') + style(clean(value), '0;34');
  });
  return [
    formatAnsiBlock([style(title, '0;30')]),
    formatAnsiBlock(renderRows(block2Rows)),
    formatAnsiBlock(renderRows(block3Rows))
  ].join('\n');
}

export { badReplySessions, getBadReplies };
