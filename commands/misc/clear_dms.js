import TaskManager from "../../utils/TaskManager.js";
import RateLimitManager from "../../utils/RateLimitManager.js";
import { log } from "../../utils/functions.js";

export default {
  name: "clear_dms",
  description: "Clear a specified number of messages in DMs.",
  aliases: ["purgdms", "deletedms"],
  usage: "<amount>",
  category: "misc",
  type: "dm_only",
  permissions: ["SendMessages"],
  cooldown: 60,

  execute: async (client, message, args) => {
    try {
      if (message.author.id !== client.user.id) return;

      const amount = parseInt(args[0]);
      if (!amount || amount < 1 || amount > 1000) {
        return message.channel.send(
          "> ❌ Amount must be a number between 1 and 1000."
        );
      }

      if (message.channel.type !== "DM") {
        return message.channel.send("> ❌ This command only works in DMs.");
      }

      const task = TaskManager.createTask("clear_dms", message.author.id);
      if (!task) {
        return message.reply("A clear_dms task is already in progress.");
      }

      try {
        const rateLimiter = new RateLimitManager(5, 5000); // Batch size: 5, Delay: 5 seconds
        let deleted = 0;
        let failed = 0;
        let isCancelled = false;

        // Create status message
        const statusMsg = createStyledStatusMessage(await message.channel.send(formatStatus(
          `> ⏳ Clearing ${amount} messages...`
        )));

        // Add cancellation listener
        if (task.signal) {
          task.signal.addEventListener("abort", () => {
            if (!task.signal.reason || task.signal.reason !== "completed") {
              isCancelled = true;
              statusMsg
                .edit(
                  `> ⚠️ Clear DMs task cancelled after deleting ${deleted} messages.`
                )
                .catch(() => {});
            }
          });
        }

        const messages = await message.channel.messages.fetch({
          limit: amount,
        });

        for (const [, msg] of messages) {
          if (task.signal.aborted) break;

          if (msg.author.id === client.user.id) {
            try {
              await rateLimiter.execute(async () => {
                if (task.signal.aborted) return;
                return msg.delete().catch((err) => {
                  log(
                    `Failed to delete message ${msg.id}: ${err.message}`,
                    "error"
                  );
                  failed++;
                });
              }, task.signal);
              deleted++;

              // Update status every 10 deletions
              if (deleted % 10 === 0) {
                statusMsg
                  .edit(
                    `> ⏳ Clearing messages... Progress: ${deleted}/${amount}`
                  )
                  .catch(() => {});
              }
            } catch (error) {
              if (task.signal.aborted || error.message.includes("cancelled"))
                break;
              failed++;
              log(
                `Error deleting message ${msg.id}: ${error.message}`,
                "error"
              );
            }
          }
        }

        if (!isCancelled) {
          statusMsg
            .edit(`> ✅ Deleted ${deleted} messages. Failed: ${failed}`)
            .catch(() => {});
        }
      } catch (error) {
        log(`Error during clear_dms task: ${error.message}`, "error");
        message.channel.send("> ❌ An error occurred while clearing messages.");
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
