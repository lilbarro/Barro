import { log } from "../../utils/functions.js";
import TaskManager from "../../utils/TaskManager.js";
import RateLimitManager from "../../utils/RateLimitManager.js";
import { THEME } from "../../utils/theme.js";
import { formatHeaderTitle } from "../../utils/functions.js";

export default {
  name: "spam",
  description: "Send repeated channel messages",
  aliases: ["spammer", "flood"],
  usage: "<count> <message>",
  category: "troll",
  type: "both",
  permissions: ["SendMessages"],
  cooldown: 60,

  async execute(client, message, args) {
    if (args[0] && ["help", "--help", "-h"].includes(args[0].toLowerCase())) {
      return message.channel.send(`> **Spam Help**\n> Usage: \`${client.prefix}spam <count> <message>\`\n> Aliases: \`${client.prefix}spammer\`, \`${client.prefix}flood\`\n> Count must be between 1 and 50.`);
    }

    if (args.length < 2) {
      return message.channel.send(formatThreeBlock(
        'Barro Spam',
        [['Usage', 'spam <count> <message>']],
        [['Example', 'spam 10 Hello World!']]
      ));
    }

    const count = parseInt(args[0]);
    if (!count || count <= 0 || count > 50) {
      return message.channel.send(formatThreeBlock('Barro Spam', [['Count', 'Invalid']], [['Result', 'Please provide a valid number between 1 and 50.']]));
    }

    const spamMessage = args.slice(1).join(" ");
    if (!spamMessage.trim()) {
      return message.channel.send(formatThreeBlock('Barro Spam', [['Count', String(count)]], [['Result', 'Please provide a message to spam.']]));
    }

    const channelId = message.channel.id;
    const guildId = message.guild?.id || "dm";
    const taskName = `spam_${channelId}`;

    // Check if spam task is already running in this channel
    if (TaskManager.hasTask(taskName, guildId)) {
      return message.channel.send(formatThreeBlock('Barro Spam', [['Count', String(count)]], [['Result', 'A spam task is already running in this channel.']]));
    }

    // Create spam task
    const task = TaskManager.createTask(taskName, guildId);
    if (!task) {
      return message.channel.send(formatThreeBlock('Barro Spam', [['Count', String(count)]], [['Result', 'Failed to create spam task.']]));
    }

    try {
      // Initialize rate limiter (sequential, 1 concurrent operation)
      const rateLimiter = new RateLimitManager(1);

      // Send confirmation message
      const statusMsg = await message.channel.send(formatAnsiBlock([
        ...formatRows([['Status', 'Starting']], '37')
      ]));

      let sentCount = 0;
      let isCancelled = false;

      // Register a check for if the task has been cancelled
      let checkInterval;
      const checkCancellation = () => {
        if (task.signal.aborted || isCancelled) {
          isCancelled = true;
          if (checkInterval) {
            clearInterval(checkInterval);
            checkInterval = null;
          }
          statusMsg
            .edit(formatThreeBlock('Barro Spam', [['Count', String(count)]], [['Result', `Spam cancelled after sending ${sentCount}/${count} messages.`]]))
            .catch(() => {});
        }
      };

      try {
        checkInterval = TaskManager.createInterval(
          task.id,
          checkCancellation,
          500
        );
      } catch (intervalError) {
        // If task was destroyed, don't create fallback interval
        log(`Task ${task.id} was destroyed, cancelling spam operation`, "warn");
        isCancelled = true;
        return;
      }

      // Create spam tasks with proper cancellation support
      for (let i = 0; i < count && !isCancelled; i++) {
        try {
          // Check for cancellation before each message
          if (task.signal.aborted || isCancelled) {
            break;
          }

          await rateLimiter.execute(async () => {
            // Double-check cancellation inside the rate limiter
            if (task.signal.aborted || isCancelled) {
              return;
            }
            await message.channel.send(spamMessage);
            sentCount++;
          }, task.signal); // Pass the abort signal to rate limiter

          // Aggressive delay for first 20 messages, standard delay thereafter
          const delay = sentCount <= 20 ? Math.floor(Math.random() * 100 + 100) : 50;
          await new Promise((resolve) => {
            const timeout = setTimeout(resolve, delay);
            if (task.signal) {
              task.signal.addEventListener("abort", () => {
                clearTimeout(timeout);
                resolve();
              });
            }
          });
        } catch (error) {
          if (
            task.signal.aborted ||
            isCancelled ||
            error.message.includes("cancelled")
          ) {
            break;
          }
          log(`Error sending spam message: ${error.message}`, "warn");
        }
      }

      // Only update status if not cancelled
      if (!isCancelled) {
        statusMsg
          .edit(formatAnsiBlock([
            ...formatRows([['Status', 'Complete']], '37')
          ]))
          .then((msg) => {
            // Always use regular setTimeout since task will be destroyed in finally block
            setTimeout(() => {
              msg.delete().catch(() => {});
            }, 5000);
          })
          .catch(() => {}); // Handle edit errors gracefully
      }

      log(
        `Spam completed in ${
          message.guild?.name || "DM"
        }: ${sentCount}/${count} messages`,
        "debug"
      );
    } catch (error) {
      log(`Error in spam command: ${error.message}`, "error");
      message.channel.send(formatAnsiBlock([
        ...formatRows([['Result', `An error occurred during spam: ${error.message}`]], '37')
      ]));
    } finally {
      // Clean up task
      task.stop();
    }
  },
};

function style(text, colorCode) {
  return `\u001b[${colorCode}m${text}\u001b[0m`;
}

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

function formatRows(rows, valueColor = THEME.ACCENT_COLOR) {
  const width = rows.reduce((max, [label]) => Math.max(max, label.length), 0);
  return rows.map(([label, value]) => style(label.padEnd(width, ' '), '37') + style(' | ', '0;30') + style(value, valueColor));
}

function formatThreeBlock(title, block2Rows, block3Rows) {
  return formatAnsiBlocks([
    [formatHeaderTitle(title)],
    formatRows(block2Rows),
    formatRows(block3Rows)
  ]);
}

