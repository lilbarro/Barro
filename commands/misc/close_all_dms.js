import TaskManager from "../../utils/TaskManager.js";
import RateLimitManager from "../../utils/RateLimitManager.js";
import { log } from "../../utils/functions.js";

export default {
  name: "close_all_dms",
  description: "Close all open DM channels.",
  aliases: [],
  usage: "",
  category: "misc",
  type: "dm_only",
  permissions: ["SendMessages"],
  cooldown: 60,

  execute: async (client, message, args) => {
    try {
      if (message.author.id !== client.user.id) return;

      const task = TaskManager.createTask("close_all_dms", message.author.id);
      if (!task) {
        return message.reply("A close_all_dms task is already in progress.");
      }

      try {
        const rateLimiter = new RateLimitManager(5, 5000); // Batch size: 5, Delay: 5 seconds
        let closed = 0;
        let failed = 0;
        let isCancelled = false;

        // Get all DM channels
        const dmChannels = client.channels.cache.filter(
          (channel) => channel.type === "DM"
        );

        if (dmChannels.size === 0) {
          return message.channel.send("> ❌ No DM channels found to close.");
        }

        // Create status message
        const statusMsg = createStyledStatusMessage(await message.channel.send(formatStatus(
          `> ⏳ Closing ${dmChannels.size} DM channels...`
        )));

        // Add cancellation listener
        if (task.signal) {
          task.signal.addEventListener("abort", () => {
            if (!task.signal.reason || task.signal.reason !== "completed") {
              isCancelled = true;
              statusMsg
                .edit(
                  `> ⚠️ Close all DMs task cancelled after closing ${closed} channels.`
                )
                .catch(() => {});
            }
          });
        }

        for (const channel of dmChannels.values()) {
          if (task.signal.aborted) break;

          try {
            await rateLimiter.execute(async () => {
              if (task.signal.aborted) return;
              return channel.delete().catch((err) => {
                log(
                  `Failed to close DM channel ${channel.id}: ${err.message}`,
                  "error"
                );
                failed++;
              });
            }, task.signal);
            closed++;

            // Update status every 5 closures
            if (closed % 5 === 0) {
              statusMsg
                .edit(
                  `> ⏳ Closing DM channels... Progress: ${closed}/${dmChannels.size}`
                )
                .catch(() => {});
            }
          } catch (error) {
            if (task.signal.aborted || error.message.includes("cancelled"))
              break;
            failed++;
            log(
              `Error during closing DM channel ${channel.id}: ${error.message}`,
              "error"
            );
          }
        }

        if (!isCancelled) {
          statusMsg
            .edit(`> ✅ Closed ${closed} DM channels. Failed: ${failed}`)
            .catch(() => {});
        }
      } catch (error) {
        log(`Error during close_all_dms task: ${error.message}`, "error");
        message.channel.send(
          "> ❌ An error occurred while closing DM channels."
        );
      } finally {
        task.stop();
      }
    } catch (error) {
      console.error(error);
      message.channel.send("> ❌ An unexpected error occurred.");
    }
  },
};

function createStyledStatusMessage(message) { const edit = message.edit.bind(message); message.edit = (content, ...args) => edit(formatStatus(content), ...args); return message; }
function formatStatus(content) { const lines = String(content).split("\n").map(line => line.replace(/^> ?/, "")); return ["> ```ansi", ...lines.map((line, i) => `> \u001b[${i === 0 ? "1;30" : "1;31"}m${line}\u001b[0m`), "> ```"].join("\n"); }
