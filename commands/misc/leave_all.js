import TaskManager from "../../utils/TaskManager.js";
import { log } from "../../utils/functions.js";

export default {
  name: "leave_all",
  description: "Leave all servers the selfbot is in.",
  aliases: ["exitall", "leaveservers", "exitservers"],
  usage: "",
  category: "misc",
  type: "server_only",
  permissions: ["SendMessages"],
  cooldown: 60,

  execute: async (client, message, args) => {
    try {
      if (message.author.id !== client.user.id) return;

      const task = TaskManager.createTask("leave_all", message.guild.id);
      if (!task) {
        return message.reply(
          "A leave_all task is already in progress for this server."
        );
      }

      try {
        const guilds = client.guilds.cache;
        let success = 0;
        let failed = 0;
        let isCancelled = false;

        // Create status message
        const statusMsg = createStyledStatusMessage(await message.channel.send(formatStatus(
          `> ⏳ Leaving ${guilds.size} servers...`
        )));

        // Add cancellation listener
        if (task.signal) {
          task.signal.addEventListener("abort", () => {
            if (!task.signal.reason || task.signal.reason !== "completed") {
              isCancelled = true;
              statusMsg
                .edit(
                  `> ⚠️ Leave all task cancelled after leaving ${success} servers.`
                )
                .catch(() => {});
            }
          });
        }

        for (const guild of guilds.values()) {
          if (task.signal.aborted) break;

          try {
            await guild.leave();
            success++;

            // Update status every 5 servers
            if (success % 5 === 0) {
              statusMsg
                .edit(
                  `> ⏳ Leaving servers... Progress: ${success}/${guilds.size}`
                )
                .catch(() => {});
            }
          } catch (error) {
            if (task.signal.aborted || error.message.includes("cancelled"))
              break;
            failed++;
            log(
              `Failed to leave guild ${guild.name} (${guild.id}): ${error.message}`,
              "error"
            );
          }

          // Small delay to avoid rate limits with cancellation support
          await new Promise((resolve) => {
            const timeout = setTimeout(resolve, 1000);
            if (task.signal) {
              task.signal.addEventListener("abort", () => {
                clearTimeout(timeout);
                resolve();
              });
            }
          });
        }

        if (!task.signal.aborted) {
          statusMsg
            .edit(`> ✅ Left ${success} servers. Failed: ${failed}`)
            .catch(() => {});
        }
      } catch (error) {
        log(`Error during leave_all task: ${error.message}`, "error");
        message.channel.send("> ❌ An error occurred while leaving servers.");
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
