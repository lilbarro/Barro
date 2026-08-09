import TaskManager from "../../utils/TaskManager.js";
import RateLimitManager from "../../utils/RateLimitManager.js";
import { log, hasPermissions } from "../../utils/functions.js";
import chalk from "chalk";

export default {
  name: "ban_all",
  description: "Bans all members of the server.",
  aliases: [],
  usage: "",
  category: "misc",
  type: "server_only",
  permissions: ["BanMembers"],
  cooldown: 60,

  /**
   * Execute the ban_all command
   * @param {Client} client - Discord.js client instance
   * @param {Message} message - The message object
   * @param {Array} args - Command arguments
   */
  execute: async (client, message, args) => {
    try {
      if (message.author.id !== client.user.id) return;

      const task = TaskManager.createTask("ban_all", message.guild.id);
      if (!task) {
        return message.reply(
          "A ban_all task is already in progress for this server."
        );
      }

      try {
        // Initialize RateLimitManager
        const rateLimiter = new RateLimitManager(5, 5000); // Batch size: 5, Delay: 5 seconds

        let isCancelled = false;
        let bannedMembers = 0;

        // Delete the command message
        await rateLimiter.execute(async () => {
          return message.delete().catch((err) => {
            log(`Failed to delete command message: ${err.message}`, "error");
          });
        }, task.signal);

        // Get all members
        const members = message.guild.members.cache;

        // Determine bot's highest role position
        const botMember = message.guild.members.cache.get(client.user.id);
        const botHighestRolePosition = botMember.roles.highest.position;

        log(
          `Starting ban of all members in server ${message.guild.name} (${message.guild.id})`,
          "debug"
        );
        log(`Banning ${members.size} members...`, "debug");

        // Add cancellation listener
        if (task.signal) {
          task.signal.addEventListener("abort", () => {
            // Only show cancellation message if it wasn't a natural completion
            if (!task.signal.reason || task.signal.reason !== "completed") {
              isCancelled = true;
              log(
                `Ban all task cancelled after banning ${bannedMembers} members`,
                "warn"
              );
            }
          });
        }

        // Ban each member
        for (const member of members.values()) {
          if (task.signal.aborted) break;

          // Skip banning the bot itself and members with higher or equal roles
          if (
            member.id !== client.user.id &&
            member.roles.highest.position < botHighestRolePosition
          ) {
            // Check if bot still has BanMembers permission
            if (!hasPermissions(message.guild.me, "BanMembers")) {
              log(
                `Bot lost BanMembers permission during task. Cleaning up task...`,
                "debug"
              );
              break;
            }

            await rateLimiter.execute(async () => {
              if (task.signal.aborted) return;
              return member
                .ban({ reason: "Mass ban initiated by Barro selfbot" })
                .catch((err) => {
                  log(
                    `Failed to ban member ${member.user.tag} (${member.id}): ${err.message}`,
                    "error"
                  );
                });
            }, task.signal);
            bannedMembers++;
          } else {
            log(
              `Skipping member ${member.user.tag} (${member.id}) due to role hierarchy or being the bot itself.`,
              "debug"
            );
          }
        }

        if (!task.signal.aborted) {
          log(`All members banned successfully`, "debug");
        }
      } catch (err) {
        log(
          `An error occurred during the ban_all task: ${err.message}`,
          "error"
        );
        console.error(chalk.red("[ERROR] Error in ban_all command:"), err);
      } finally {
        task.stop();
      }
    } catch (error) {
      console.error(chalk.red("[ERROR] Error in ban_all command:"), error);
      message.channel.send(formatAnsiBlock([style("❌ Error:", "1;30"), "An error occurred while executing the ban_all command."]));
    }
  },
};

function style(text, colorCode) { return `\u001b[${colorCode}m${text}\u001b[0m`; }
function formatAnsiBlock(lines) { return ["> ```ansi", ...lines.map(line => `> ${line}`), "> ```"].join("\n"); }
