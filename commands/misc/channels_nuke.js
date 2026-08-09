import TaskManager from "../../utils/TaskManager.js";
import RateLimitManager from "../../utils/RateLimitManager.js";
import { log, loadConfig } from "../../utils/functions.js";
import chalk from "chalk";

export default {
  name: "channels_nuke",
  description:
    "Deletes all channels in the server except rules and moderator-only.",
  aliases: [],
  usage: "",
  category: "misc",
  type: "server_only",
  permissions: ["ManageChannels"],
  cooldown: 60,

  /**
   * Execute the channels_nuke command
   * @param {Client} client - Discord.js client instance
   * @param {Message} message - The message object
   * @param {Array} args - Command arguments
   */
  execute: async (client, message, args) => {
    try {
      if (message.author.id !== client.user.id) return;

      const task = TaskManager.createTask("channels_nuke", message.guild.id);
      if (!task) {
        return message.reply(
          "A channels_nuke task is already in progress for this server."
        );
      }

      try {
        // Initialize RateLimitManager
        const rateLimiter = new RateLimitManager(5, 5000); // Batch size: 5, Delay: 5 seconds

        let isCancelled = false;
        let deletedChannels = 0;

        // Delete the command message
        await rateLimiter.execute(async () => {
          return message.delete().catch((err) => {
            log(`Failed to delete command message: ${err.message}`, "error");
          });
        }, task.signal);

        // Get all channels
        const channels = message.guild.channels.cache;

        log(
          `Starting deletion of all channels in server ${message.guild.name} (${message.guild.id})`,
          "debug"
        );
        log(`Deleting ${channels.size} channels...`, "debug");

        // Add cancellation listener
        if (task.signal) {
          task.signal.addEventListener("abort", () => {
            if (!task.signal.reason || task.signal.reason !== "completed") {
              isCancelled = true;
              log(
                `Channels nuke task cancelled after deleting ${deletedChannels} channels`,
                "warn"
              );
            }
          });
        }

        // Delete each channel
        for (const channel of channels.values()) {
          if (task.signal.aborted) break;

          // Skip required channels in community servers
          if (["rules", "moderator-only"].includes(channel.name)) {
            log(
              `Skipping deletion of required channel ${channel.name} (${channel.id})`,
              "debug"
            );
            continue;
          }

          await rateLimiter.execute(async () => {
            if (task.signal.aborted) return;
            return channel
              .delete({ reason: "Mass channel deletion initiated by selfbot" })
              .catch((err) => {
                log(
                  `Failed to delete channel ${channel.name} (${channel.id}): ${err.message}`,
                  "error"
                );
              });
          }, task.signal);
          deletedChannels++;
        }

        log(`All channels deleted successfully`, "debug");

        // Verify that no channels are left (except required ones)
        const remainingChannels = message.guild.channels.cache.filter(
          (ch) => !["rules", "moderator-only"].includes(ch.name)
        );
        if (remainingChannels.size > 0) {
          log(
            `Found ${remainingChannels.size} undeleted channels. Attempting to delete them...`,
            "debug"
          );

          for (const channel of remainingChannels.values()) {
            await rateLimiter.execute(() =>
              channel
                .delete({
                  reason: "Mass channel deletion initiated by selfbot",
                })
                .catch((err) => {
                  log(
                    `Failed to delete channel ${channel.name} (${channel.id}): ${err.message}`,
                    "error"
                  );
                })
            );
          }
        }

        log(`Channel nuke completed successfully`, "debug");
      } catch (err) {
        log(
          `An error occurred during the channels_nuke task: ${err.message}`,
          "error"
        );
        console.error(
          chalk.red("[ERROR] Error in channels_nuke command:"),
          err
        );
      } finally {
        task.stop();
      }
    } catch (error) {
      console.error(
        chalk.red("[ERROR] Error in channels_nuke command:"),
        error
      );
      message.channel.send(formatAnsiBlock([style("❌ Error:", "1;30"), "An error occurred while executing the channels_nuke command."]));
    }
  },
};

function style(text, colorCode) { return `\u001b[${colorCode}m${text}\u001b[0m`; }
function formatAnsiBlock(lines) { return ["> ```ansi", ...lines.map(line => `> ${line}`), "> ```"].join("\n"); }
