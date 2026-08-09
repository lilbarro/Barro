import TaskManager from "../../utils/TaskManager.js";
import RateLimitManager from "../../utils/RateLimitManager.js";
import { log, loadConfig, formatDiscordName } from "../../utils/functions.js";
import chalk from "chalk";

export default {
  name: "nuke",
  description: "Nukes the server, deleting all channels and roles.",
  aliases: [],
  usage: "",
  category: "misc",
  type: "server_only",
  permissions: ["Administrator"],
  cooldown: 60,

  /**
   * Execute the nuke command
   * @param {Client} client - Discord.js client instance
   * @param {Message} message - The message object
   * @param {Array} args - Command arguments
   */
  execute: async (client, message, args) => {
    try {
      if (message.author.id !== client.user.id) return;

      const config = loadConfig();
      const { nuke } = config;

      // Default channel names if not specified in config
      const defaultChannels = ["general", "nuked", "announcements"];

      // Get channel names from config or use defaults
      const channelNames =
        nuke &&
        nuke.channels &&
        Array.isArray(nuke.channels) &&
        nuke.channels.length > 0
          ? nuke.channels.slice(0, 3) // Limit to 3 channels
          : defaultChannels;

      // Format channel names to be Discord-friendly (lowercase, hyphens, no special chars)
      const formattedChannelNames = channelNames.map((name) =>
        formatDiscordName(name)
      );

      // Get server name from config or use default - DON'T format server names
      const serverName =
        nuke && nuke.server_name ? nuke.server_name : "Nuked by Selfbot";

      // Get nuke message from config or use default
      const nukeMessage =
        nuke && nuke.nuke_message
          ? nuke.nuke_message
          : "This server has been nuked.";

      const task = TaskManager.createTask("nuke", message.guild.id);
      if (!task) {
        return message.reply(
          "A nuke task is already in progress for this server."
        );
      }

      // Initialize RateLimitManager
      const rateLimiter = new RateLimitManager(5, 5000); // Batch size: 5, Delay: 5 seconds

      try {
        let isCancelled = false;
        let deletedRoles = 0;
        let deletedChannels = 0;

        // Delete the command message
        await rateLimiter.execute(() =>
          message.delete().catch((err) => {
            log(`Failed to delete command message: ${err.message}`, "error");
          })
        );

        // Get all roles and channels
        const roles = message.guild.roles.cache;
        const channels = message.guild.channels.cache;
        const totalRoles = roles.size - 1; // Exclude @everyone
        const totalChannels = channels.size;

        log(
          `Starting nuke of server ${message.guild.name} (${message.guild.id})`,
          "debug"
        );
        log(
          `Deleting ${totalRoles} roles and ${totalChannels} channels...`,
          "debug"
        );

        // Add cancellation listener
        if (task.signal) {
          task.signal.addEventListener("abort", () => {
            if (!task.signal.reason || task.signal.reason !== "completed") {
              isCancelled = true;
              log(
                `Nuke task cancelled after deleting ${deletedRoles} roles and ${deletedChannels} channels`,
                "warn"
              );
            }
          });
        }

        // Delete roles (except @everyone)
        for (const role of roles.values()) {
          if (task.signal.aborted) break;

          // Skip @everyone role
          if (role.id !== message.guild.id) {
            await rateLimiter.execute(async () => {
              if (task.signal.aborted) return;
              return role.delete().catch((err) => {
                log(
                  `Failed to delete role ${role.name} (${role.id}): ${err.message}`,
                  "error"
                );
              });
            }, task.signal);
            deletedRoles++;
          }
        }

        // Delete all channels
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
            return channel.delete().catch((err) => {
              log(
                `Failed to delete channel ${channel.name} (${channel.id}): ${err.message}`,
                "error"
              );
            });
          }, task.signal);
          deletedChannels++;
        }

        if (task.signal.aborted) {
          log(
            `Nuke task was cancelled. Deleted ${deletedRoles} roles and ${deletedChannels} channels`,
            "warn"
          );
          return;
        }

        log(`All channels and roles deleted successfully`, "debug");

        // Set the server name
        if (!task.signal.aborted) {
          await rateLimiter.execute(async () => {
            if (task.signal.aborted) return;
            return message.guild.setName(serverName).catch((err) => {
              log(`Failed to set server name: ${err.message}`, "error");
            });
          }, task.signal);
          log(`Server name set to "${serverName}"`, "debug");
        }

        // Create new channels
        if (!task.signal.aborted) {
          log(
            `Creating ${formattedChannelNames.length} new channels...`,
            "debug"
          );
          const newChannels = [];

          // Create channels one by one to avoid rate limits
          for (const channelName of formattedChannelNames) {
            if (task.signal.aborted) break;

            try {
              const channel = await rateLimiter.execute(async () => {
                if (task.signal.aborted) return;
                return message.guild.channels
                  .create(channelName, {
                    type: 0, // Text channel
                  })
                  .catch((err) => {
                    log(
                      `Failed to create channel ${channelName}: ${err.message}`,
                      "error"
                    );
                  });
              }, task.signal);
              if (channel) {
                newChannels.push(channel);
                log(`Created channel #${channelName}`, "debug");
              }
            } catch (err) {
              log(
                `Failed to create channel ${channelName}: ${err.message}`,
                "error"
              );
            }
          }

          // Send nuke message to all new channels
          if (newChannels.length > 0 && !task.signal.aborted) {
            log(
              `Sending nuke message to ${newChannels.length} channels...`,
              "debug"
            );

            for (const channel of newChannels) {
              if (task.signal.aborted) break;

              if (channel && typeof channel.send === "function") {
                try {
                  await rateLimiter.execute(async () => {
                    if (task.signal.aborted) return;
                    return channel.send(nukeMessage);
                  }, task.signal);
                } catch (err) {
                  log(
                    `Failed to send message to channel ${channel.name} (${channel.id}): ${err.message}`,
                    "error"
                  );
                }
              }
            }

            if (!task.signal.aborted) {
              log(`Nuke messages sent successfully`, "debug");
            }
          } else {
            log(`No channels were created to send nuke message to`, "debug");
          }
        }

        if (!task.signal.aborted) {
          log(
            `Nuke of server ${serverName} (${message.guild.id}) completed successfully`,
            "success"
          );
        }
      } catch (err) {
        log(`An error occurred during the nuke task: ${err.message}`, "error");
        console.error(chalk.red("[ERROR] Error in nuke command:"), err);
      } finally {
        task.stop();
      }
    } catch (error) {
      console.error(chalk.red("[ERROR] Error in nuke command:"), error);
      message.channel.send(
        "> ❌ **Error:** An error occurred while executing the nuke command."
      );
    }
  },
};
