import TaskManager from "../../utils/TaskManager.js";
import RateLimitManager from "../../utils/RateLimitManager.js";
import { log, loadConfig } from "../../utils/functions.js";
import chalk from "chalk";

export default {
  name: "roles_nuke",
  description: "Deletes all roles in the server except @everyone.",
  aliases: [],
  usage: "",
  category: "misc",
  type: "server_only",
  permissions: ["ManageRoles"],
  cooldown: 60,

  /**
   * Execute the roles_nuke command
   * @param {Client} client - Discord.js client instance
   * @param {Message} message - The message object
   * @param {Array} args - Command arguments
   */
  execute: async (client, message, args) => {
    try {
      if (message.author.id !== client.user.id) return;

      const task = TaskManager.createTask("roles_nuke", message.guild.id);
      if (!task) {
        return message.reply(
          "A roles_nuke task is already in progress for this server."
        );
      }

      try {
        let isCancelled = false;
        let deletedRoles = 0;

        // Initialize RateLimitManager
        const rateLimiter = new RateLimitManager(5, 5000); // Batch size: 5, Delay: 5 seconds

        // Delete the command message
        await rateLimiter.execute(async () => {
          return message.delete().catch((err) => {
            log(`Failed to delete command message: ${err.message}`, "error");
          });
        }, task.signal);

        // Get all roles
        const roles = message.guild.roles.cache;

        // Determine bot's highest role position
        const botMember = message.guild.members.cache.get(client.user.id);
        const botHighestRolePosition = botMember.roles.highest.position;

        log(
          `Starting deletion of all roles in server ${message.guild.name} (${message.guild.id})`,
          "debug"
        );
        log(`Deleting ${roles.size} roles...`, "debug");

        // Add cancellation listener
        if (task.signal) {
          task.signal.addEventListener("abort", () => {
            if (!task.signal.reason || task.signal.reason !== "completed") {
              isCancelled = true;
              log(
                `Roles nuke task cancelled after deleting ${deletedRoles} roles`,
                "warn"
              );
            }
          });
        }

        // Delete each role
        for (const role of roles.values()) {
          if (task.signal.aborted) break;

          // Skip required roles like @everyone
          if (role.name === "@everyone") {
            log(
              `Skipping deletion of required role ${role.name} (${role.id})`,
              "debug"
            );
            continue;
          }

          // Skip managed roles (created by real bots)
          if (role.managed) {
            log(
              `Skipping deletion of managed role ${role.name} (${role.id})`,
              "debug"
            );
            continue;
          }

          // Skip roles higher or equal in the role hierarchy
          if (role.position >= botHighestRolePosition) {
            log(
              `Skipping deletion of role ${role.name} (${role.id}) due to role hierarchy`,
              "debug"
            );
            continue;
          }

          await rateLimiter.execute(async () => {
            if (task.signal.aborted) return;
            return role
              .delete({ reason: "Mass role deletion initiated by selfbot" })
              .catch((err) => {
                log(
                  `Failed to delete role ${role.name} (${role.id}): ${err.message}`,
                  "error"
                );
              });
          }, task.signal);
          deletedRoles++;
        }

        if (task.signal.aborted) {
          log(
            `Roles nuke task was cancelled. Deleted ${deletedRoles} roles`,
            "warn"
          );
          return;
        }

        log(`All roles deleted successfully`, "debug");

        // Verify that no roles are left (except required ones)
        const remainingRoles = message.guild.roles.cache.filter(
          (r) => r.name !== "@everyone"
        );
        if (remainingRoles.size > 0 && !task.signal.aborted) {
          log(
            `Found ${remainingRoles.size} undeleted roles. Attempting to delete them...`,
            "debug"
          );

          for (const role of remainingRoles.values()) {
            if (task.signal.aborted) break;

            await rateLimiter.execute(async () => {
              if (task.signal.aborted) return;
              return role
                .delete({ reason: "Mass role deletion initiated by selfbot" })
                .catch((err) => {
                  log(
                    `Failed to delete role ${role.name} (${role.id}): ${err.message}`,
                    "error"
                  );
                });
            }, task.signal);
            deletedRoles++;
          }
        }

        if (!task.signal.aborted) {
          log(`Role nuke completed successfully`, "debug");
        }
      } catch (err) {
        log(
          `An error occurred during the roles_nuke task: ${err.message}`,
          "error"
        );
        console.error(chalk.red("[ERROR] Error in roles_nuke command:"), err);
      } finally {
        task.stop();
      }
    } catch (error) {
      console.error(chalk.red("[ERROR] Error in roles_nuke command:"), error);
      message.channel.send(
        "> ❌ **Error:** An error occurred while executing the roles_nuke command."
      );
    }
  },
};
