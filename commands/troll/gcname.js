import { log, wait, style } from "../../utils/functions.js";
import TaskManager from "../../utils/TaskManager.js";
import { THEME } from "../../utils/theme.js";
import { formatHeaderTitle } from "../../utils/functions.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PHRASES_FILE = path.join(__dirname, "..", "..", "data", "gc_phrases.json");

const gcNameSessions = new Map();

export default {
  name: "gcname",
  description: "Cycle toxic group names",
  aliases: ["gcspam"],
  usage: "start | stop",
  category: "troll",
  type: "both",
  permissions: ["SendMessages"],
  cooldown: 1,

  async execute(_client, message, args) {
    if (!args.length) {
      return message.channel.send(formatThreeBlock(
        "Barro v2 GCName",
        [
          ["Usage", `${_client.prefix}gcname start`],
          ["Stop", `${_client.prefix}gcname stop`]
        ],
        [["Info", "Spams toxic names to the current group chat. Automatically stops after 20 changes."]]
      ));
    }

    const subcommand = args[0].toLowerCase();
    if (subcommand === "start") {
      return this.startGcNameSpam(_client, message);
    }

    if (subcommand === "stop") {
      return this.stopGcNameSpam(_client, message);
    }

    return message.channel.send(formatThreeBlock(
      "Barro v2 GCName",
      [
        ["Usage", `${_client.prefix}gcname start`],
        ["Stop", `${_client.prefix}gcname stop`]
      ],
      [["Info", "Invalid subcommand. Use 'start' or 'stop'."]]
    ));
  },

  async startGcNameSpam(_client, message) {
    const channel = message.channel;
    const channelId = channel.id;

    if (gcNameSessions.has(channelId)) {
      return message.channel.send(formatThreeBlock("Barro GCName", [["Status", "ACTIVE"]], [["Result", "GC name spam is already running in this chat!"]]));
    }

    // Use a unique key for the task
    const taskId = `gcname_${channelId}`;
    const task = TaskManager.createTask(taskId, channelId);

    if (!task) {
      return message.channel.send(formatThreeBlock("Barro GCName", [["Status", "ERROR"]], [["Result", "Failed to create spam task!"]]));
    }

    const sessionData = {
      channelId,
      startedBy: message.author.id,
      startedAt: Date.now(),
      task,
      isCancelled: false,
    };

    // Handle task cancellation
    if (task.signal) {
      task.signal.addEventListener("abort", () => {
        sessionData.isCancelled = true;
        gcNameSessions.delete(channelId);
      });
    }

    gcNameSessions.set(channelId, sessionData);

    // The spam loop is handled by the task runner
    // We define the work here. Note: TaskManager in this bot seems to be a custom wrapper.
    // Since I don't have the TaskManager implementation, I'll implement the loop
    // as an async function that runs until the task is stopped.

    const runSpam = async () => {
      try {
        let currentMinDelay = 100;
        let currentMaxDelay = 200;
        let changeCount = 0;

        while (!sessionData.isCancelled && changeCount < 20) {
          let phrases = [];
          try {
            const data = fs.readFileSync(PHRASES_FILE, "utf8");
            phrases = JSON.parse(data);
          } catch (e) {
            log(`Error loading GC phrases: ${e.message}`, "error");
            sessionData.isCancelled = true;
            break;
          }

          const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];

          try {
            await channel.setName(randomPhrase);
            changeCount++;
            log(`Changed GC name to: ${randomPhrase} (${changeCount}/20)`, "debug");

            // Gradually speed back up if we were slowed down, but cap at initial 100-200ms
            if (currentMinDelay > 100) {
              currentMinDelay = Math.max(100, currentMinDelay - 50);
              currentMaxDelay = Math.max(200, currentMaxDelay - 50);
            }
          } catch (err) {
            log(`Failed to change GC name (Rate Limited): ${err.message}`, "warn");
            // Increase delay significantly on rate limit
            currentMinDelay += 500;
            currentMaxDelay += 500;
            await wait(5000);
          }

          const delay = Math.floor(Math.random() * (currentMaxDelay - currentMinDelay + 1) + currentMinDelay);
          await wait(delay);
        }

        if (changeCount >= 20) {
          log(`Reached 20 name changes, stopping GC spam.`, "debug");
        }
      } catch (err) {
        log(`GC name spam loop crashed: ${err.message}`, "error");
      }
    };

    runSpam();

    log(`Started GC name spam in ${channelId}`, "debug");
  },

  async stopGcNameSpam(_client, message) {
    const channelId = message.channel.id;
    const sessionData = gcNameSessions.get(channelId);

    if (!sessionData) {
      return message.channel.send(formatThreeBlock("Barro GCName", [["Status", "INACTIVE"]], [["Result", "No GC name spam is currently running here!"]]));
    }

    if (sessionData.task) sessionData.task.stop();
    sessionData.isCancelled = true;
    gcNameSessions.delete(channelId);

    await message.channel.send(formatThreeBlock(
      "Barro GCName",
      [
        ["Channel", message.channel.name || "Group Chat"],
        ["Status", "STOPPED"]
      ],
      [["Result", "GC name spam has been terminated."]]
    ));
    log(`Stopped GC name spam in ${channelId}`, "debug");
  },
};

function formatAnsiBlock(lines) {
  return ['> ```ansi', ...lines.map(line => `> ${line}`), '> ```'].join('\n');
}

function formatAnsiBlocks(blocks) {
  const [firstBlock, ...remainingBlocks] = blocks;
  const output = ['> ```ansi', ...firstBlock.map(line => `> ${line}`)];
  remainingBlocks.forEach(block => output.push('> ``````ansi', ...block.map(line => `> ${line}`)));
  output.push('> ```');
  return output.join('\n');
}

function formatThreeBlock(title, block2Rows, block3Rows) {
  const clean = (value) => String(value).replace(/\[[0-9;]*m/g, '');
  const width = [...block2Rows, ...block3Rows].reduce((max, [label]) => Math.max(max, clean(label).length), 0);
  const renderRows = (rows) => rows.map(([label, value]) => {
    const left = clean(label).padEnd(width, ' ');
    return style(left, THEME.LABEL_COLOR) + style(' | ', THEME.DIVIDER_COLOR) + style(clean(value), THEME.ACCENT_COLOR);
  });
  return formatAnsiBlocks([
    [formatHeaderTitle(title)],
    renderRows(block2Rows),
    renderRows(block3Rows)
  ]);
}
