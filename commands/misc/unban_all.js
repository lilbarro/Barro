import TaskManager from "../../utils/TaskManager.js";
import RateLimitManager from "../../utils/RateLimitManager.js";
import { log } from "../../utils/functions.js";
import chalk from "chalk";

export default {
  name: "unban_all",
  description: "Unbans all banned members of the server.",
  aliases: ["unbanall", "massunban"],
  usage: "",
  category: "misc",
  type: "server_only",
  permissions: ["BanMembers"],
  cooldown: 60,

  /**
   * Execute the unban_all command
   * @param {Client} client - Discord.js client instance
   * @param {Message} message - The message object
   * @param {Array} args - Command arguments
   */
  execute: async (client, message, args) => {
    try {
      if (message.author.id !== client.user.id) return;

      const task = TaskManager.createTask("unban_all", message.guild.id);
      if (!task) {
        return message.reply(
          "An unban_all task is already in progress for this server."
        );
      }

      try {
        let isCancelled = false;
        let unbannedCount = 0;
        let failedCount = 0;

        // Initialize RateLimitManager
        const rateLimiter = new RateLimitManager(5, 5000); // Batch size: 5, Delay: 5 seconds

        // Delete the command message
        await rateLimiter.execute(async () => {
          return message.delete().catch((err) => {
            log(`Failed to delete command message: ${err.message}`, "error");
          });
        }, task.signal);

        // Fetch all banned members
        const bans = await message.guild.bans.fetch();
        log(
          `Starting unban of all banned members in server ${message.guild.name} (${message.guild.id})`,
          "debug"
        );
        log(`Unbanning ${bans.size} members...`, "debug");

        if (bans.size === 0) {
          return message.channel.send(
            "> ❌ No banned members found in this server."
          );
        }

        // Create status message
        const statusMsg = await message.channel.send(
          `> ⏳ Unbanning ${bans.size} members...`
        );

        // Add cancellation listener
        if (task.signal) {
          task.signal.addEventListener("abort", () => {
            if (!task.signal.reason || task.signal.reason !== "completed") {
              isCancelled = true;
              statusMsg
                .edit(
                  `> ⚠️ Unban all task cancelled after unbanning ${unbannedCount} members.`
                )
                .catch(() => {});
            }
          });
        }

        for (const ban of bans.values()) {
          if (task.signal.aborted) break;

          const bannedUser = ban.user;

          try {
            await rateLimiter.execute(async () => {
              if (task.signal.aborted) return;
              return message.guild.members
                .unban(bannedUser.id, {
                  reason: "Mass unban initiated by Barro selfbot",
                })
                .catch((err) => {
                  log(
                    `Failed to unban member ${bannedUser.tag} (${bannedUser.id}): ${err.message}`,
                    "error"
                  );
                  failedCount++;
                });
            }, task.signal);
            unbannedCount++;

            // Update status every 5 unbans
            if (unbannedCount % 5 === 0) {
              statusMsg
                .edit(
                  `> ⏳ Unbanning members... Progress: ${unbannedCount}/${bans.size}`
                )
                .catch(() => {});
            }
          } catch (err) {
            if (task.signal.aborted || err.message.includes("cancelled")) break;
            log(`Error during unban operation: ${err.message}`, "error");
            failedCount++;
          }
        }

        if (!task.signal.aborted) {
          log(
            `Unbanned ${unbannedCount} members successfully. Failed: ${failedCount}`,
            "success"
          );
          statusMsg
            .edit(
              `> ✅ Unbanned ${unbannedCount} members. Failed: ${failedCount}`
            )
            .catch(() => {});
        }
      } catch (err) {
        log(
          `An error occurred during the unban_all task: ${err.message}`,
          "error"
        );
        console.error(chalk.red("[ERROR] Error in unban_all command:"), err);
      } finally {
        task.stop();
      }
    } catch (error) {
      console.error(chalk.red("[ERROR] Error in unban_all command:"), error);
      message.channel.send(formatAnsiBlock([style("❌ Error:", "1;30"), "An error occurred while executing the unban_all command."]));
    }
  },
};

function style(text, colorCode) { return `\u001b[${colorCode}m${text}\u001b[0m`; }
function formatAnsiBlock(lines) { return ["> ```ansi", ...lines.map(line => `> ${line}`), "> ```"].join("\n"); }
