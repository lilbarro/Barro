import { log } from "../../utils/functions.js";
import TaskManager from "../../utils/TaskManager.js";
import { THEME } from "../../utils/theme.js";

// Map to store active typing sessions
const typingSessions = new Map();

export default {
  name: "faketyping",
  description: "Display continuous typing status",
  aliases: ["typing", "ft"],
  usage: "[stop]",
  category: "general",
  type: "both",
  permissions: ["SendMessages"],
  cooldown: 10,

  execute: async (client, message, args) => {
    if (args[0] && ['help', '--help', '-h'].includes(args[0].toLowerCase())) {
      return message.channel.send(`> **FakeTyping Help**\n> Usage: \`${client.prefix}faketyping [stop]\`\n> Aliases: ${client.prefix}typing, ${client.prefix}ft`);
    }
    try {
      if (message.author.id !== client.user.id) return;

      const channelId = message.channel.id;

      // Check if user wants to stop typing
      if (args[0]?.toLowerCase() === "stop") {
        // Check if there's an active typing session for this channel
        if (typingSessions.has(channelId)) {
          const session = typingSessions.get(channelId);

          // Stop the task
          if (session.task) {
            session.task.stop();
          }

          // Remove from sessions map
          typingSessions.delete(channelId);

          await message.channel.send(formatAnsiBlock([
            style('[ FAKETYPING ]', THEME.HEADER_BOLD_COLOR),
            '',
            style('STATUS:', THEME.LABEL_COLOR) + ' ' + style('Stopped fake typing in this channel.', THEME.ACCENT_COLOR)
          ]));
          log(
            `Stopped fake typing in channel #${
              message.channel.name || channelId
            }`,
            "debug"
          );
        } else {
          await message.channel.send(formatAnsiBlock([
            style('[ FAKETYPING ]', THEME.HEADER_BOLD_COLOR),
            '',
            style('ERROR:', THEME.LABEL_COLOR) + ' ' + style('No active typing session in this channel.', THEME.ACCENT_COLOR)
          ]));
        }
        return;
      }

      // Check if there's already an active typing session for this channel
      if (typingSessions.has(channelId)) {
        await message.channel.send(formatAnsiBlock([
          style('[ FAKETYPING ]', THEME.HEADER_BOLD_COLOR),
          '',
          style('ERROR:', THEME.LABEL_COLOR) + ' ' + style('Already typing in this channel. Use `faketyping stop` to stop.', THEME.ACCENT_COLOR)
        ]));
        return;
      }

      // Create a task for typing
      const guildId = message.guild?.id || "dm";
      const taskName = `typing_${channelId}`;
      const task = TaskManager.createTask(taskName, guildId);
      
      if (!task) {
        await message.channel.send(formatAnsiBlock([
          style('[ FAKETYPING ]', THEME.HEADER_BOLD_COLOR),
          '',
          style('ERROR:', THEME.LABEL_COLOR) + ' ' + style('Failed to create typing task.', THEME.ACCENT_COLOR)
        ]));
        return;
      }

      try {
        // Start typing immediately
        await message.channel.sendTyping();

        // Store the session
        typingSessions.set(channelId, {
          task: task,
          channelId: channelId,
          startTime: Date.now(),
          count: 0,
        });

        let isCancelled = false;

        // Add cancellation listener
        if (task.signal) {
          task.signal.addEventListener("abort", () => {
            // Only show cancellation message if it wasn't a natural completion
            if (!task.signal.reason || task.signal.reason !== "completed") {
              isCancelled = true;
              typingSessions.delete(channelId);
              log(
                `Fake typing cancelled in channel #${
                  message.channel.name || channelId
                }`,
                "warn"
              );
            }
          });
        }

        // Create a continuous typing loop
        const startTypingLoop = async () => {
          while (!task.signal.aborted && !isCancelled) {
            try {
              // Check for cancellation before each iteration
              if (task.signal.aborted || isCancelled) {
                break;
              }

              // Send typing indicator
              await message.channel.sendTyping();

              // Increment counter
              if (typingSessions.has(channelId)) {
                typingSessions.get(channelId).count++;

                // Log every minute to avoid spam
                if (typingSessions.get(channelId).count % 20 === 0) {
                  log(
                    `Still typing in channel #${
                      message.channel.name || channelId
                    } (${typingSessions.get(channelId).count / 20} minutes)`,
                    "debug"
                  );
                }
              }

              // Wait 3 seconds before next typing indicator
              await new Promise((resolve) => {
                const timeout = setTimeout(resolve, 3000);
                if (task.signal) {
                  task.signal.addEventListener("abort", () => {
                    clearTimeout(timeout);
                    resolve();
                  });
                }
              });
            } catch (error) {
              // Check if cancelled during error
              if (task.signal.aborted || isCancelled) {
                break;
              }

              log(`Error in typing task: ${error.message}`, "error");

              // If we can't send typing anymore, stop the task
              if (error.status === 403 || error.code === 50001) {
                log(
                  `Automatically stopped fake typing in channel #${
                    message.channel.name || channelId
                  } due to permissions`,
                  "warn"
                );
                break;
              }
            }
          }
        };

        // Start the typing loop (don't await it, let it run in background)
        startTypingLoop().catch((error) => {
          log(`Error in typing loop: ${error.message}`, "error");
        });

        await message.channel.send(formatAnsiBlock([
          style('[ FAKETYPING ]', THEME.HEADER_BOLD_COLOR),
          '',
          style('STATUS:', THEME.LABEL_COLOR) + ' ' + style('Started fake typing in this channel. Use `faketyping stop` to stop.', THEME.ACCENT_COLOR)
        ]));
        log(
          `Started fake typing in channel #${message.channel.name || channelId}`,
          "debug"
        );
      } catch (error) {
        log(`Error starting fake typing: ${error.message}`, "error");
        await message.channel.send(formatAnsiBlock([
          style('[ FAKETYPING ]', THEME.HEADER_BOLD_COLOR),
          '',
          style('ERROR:', THEME.LABEL_COLOR) + ' ' + style(`An error occurred: ${error.message}`, THEME.ACCENT_COLOR)
        ]));
        // Don't call task.stop() here since we want the task to continue running
        // The task will be stopped when the user runs "faketyping stop"
      }
    } catch (error) {
      log(`Error in faketyping command: ${error.message}`, 'error');
      message.channel.send(formatAnsiBlock([
        style('[ FAKETYPING ]', THEME.HEADER_BOLD_COLOR),
        '',
        style('ERROR:', THEME.LABEL_COLOR) + ' ' + style(`An error occurred: ${error.message}`, THEME.ACCENT_COLOR)
      ]));
    }
  },
};

function style(text, colorCode) {
  return `\u001b[${colorCode}m${text}\u001b[0m`;
}

function formatAnsiBlock(lines) {
  return ['> ```ansi', ...lines.map(line => `> ${line}`), '> ```'].join('\n');
}
