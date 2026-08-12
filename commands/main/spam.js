import { log } from "../../utils/functions.js";
import TaskManager from "../../utils/TaskManager.js";
import RateLimitManager from "../../utils/RateLimitManager.js";

export default {
  name: "spam",
  description: "Spam a message in the current channel",
  aliases: ["spammer", "flood"],
  usage: "<count> <message>",
  category: "troll",
  type: "both",
  permissions: ["SendMessages"],
  cooldown: 60,

  async execute(client, message, args) {
    if (args.length < 2) {
      return message.channel.send(formatAnsiBlock([
        style('[ SPAM ]', '1;30'),
        '',
        style('ERROR:', '1;31') + ' ' + style('Usage: spam <count> <message>', '0;97'),
        '  Example: spam 10 Hello World!'
      ]));
    }

    const count = parseInt(args[0]);
    if (!count || count <= 0 || count > 50) {
      return message.channel.send(formatAnsiBlock([
        style('[ SPAM ]', '1;30'),
        '',
        style('ERROR:', '1;31') + ' ' + style('Please provide a valid number between 1 and 50.', '0;97')
      ]));
    }

    const spamMessage = args.slice(1).join(" ");
    if (!spamMessage.trim()) {
      return message.channel.send(formatAnsiBlock([
        style('[ SPAM ]', '1;30'),
        '',
        style('ERROR:', '1;31') + ' ' + style('Please provide a message to spam.', '0;97')
      ]));
    }

    const channelId = message.channel.id;
    const guildId = message.guild?.id || "dm";
    const taskName = `spam_${channelId}`;

    // Check if spam task is already running in this channel
    if (TaskManager.hasTask(taskName, guildId)) {
      return message.channel.send(formatAnsiBlock([
        style('[ SPAM ]', '1;30'),
        '',
        style('WARN:', '1;31') + ' ' + style('A spam task is already running in this channel.', '0;97')
      ]));
    }

    // Create spam task
    const task = TaskManager.createTask(taskName, guildId);
    if (!task) {
      return message.channel.send(formatAnsiBlock([
        style('[ SPAM ]', '1;30'),
        '',
        style('ERROR:', '1;31') + ' ' + style('Failed to create spam task.', '0;97')
      ]));
    }

    try {
      // Initialize rate limiter (sequential, 1 concurrent operation)
      const rateLimiter = new RateLimitManager(1);

      // Send confirmation message
      const statusMsg = await message.channel.send(formatAnsiBlock([
        style('[ SPAM ]', '1;30'),
        '',
        style('INFO:', '1;31') + ' ' + style(`Starting spam: ${count} messages...`, '0;97')
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
            .edit(formatAnsiBlock([
              style('[ SPAM ]', '1;30'),
              '',
              style('RESULT:', '1;31') + ' ' + style(`Spam cancelled after sending ${sentCount}/${count} messages.`, '0;97')
            ]))
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

          // Small delay to allow cancellation checks
          await new Promise((resolve) => {
            const timeout = setTimeout(resolve, 50);
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
            style('[ SPAM ]', '1;30'),
            '',
            style('RESULT:', '1;31') + ' ' + style(`Spam completed! Sent ${sentCount}/${count} messages.`, '0;97')
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
        style('[ SPAM ]', '1;30'),
        '',
        style('ERROR:', '1;31') + ' ' + style(`An error occurred during spam: ${error.message}`, '0;97')
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

