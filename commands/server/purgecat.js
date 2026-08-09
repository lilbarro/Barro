import TaskManager from "../../utils/TaskManager.js";
import RateLimitManager from "../../utils/RateLimitManager.js";
import { log } from "../../utils/functions.js";

export default {
  name: "purgecat",
  description: "Delete all channels in a category.",
  aliases: ["purgecategory", "cleancategory"],
  usage: "<category_name>",
  category: "server",
  type: "server_only",
  permissions: ["ManageChannels"],
  cooldown: 5,

  execute: async (client, message, args) => {
    if (!message.guild) return;

    const categoryInput = args.join(" ");
    if (!categoryInput) {
      return message.channel.send("> ❌ Please provide a category name or ID.");
    }

    let category;

    // Check if input is a category ID
    if (/^\d+$/.test(categoryInput)) {
      category = message.guild.channels.cache.get(categoryInput);
    }

    // If not found by ID, try to find by name
    if (!category) {
      category = message.guild.channels.cache.find(
        (c) => c.name === categoryInput && c.type === "GUILD_CATEGORY"
      );
    }

    if (!category) {
      return message.channel.send(
        "> ❌ Category not found! Please provide a valid category name or ID."
      );
    }

    // Verify it's actually a category
    if (category.type !== "GUILD_CATEGORY") {
      return message.channel.send("> ❌ The provided ID is not a category!");
    }

    const task = TaskManager.createTask("purgecat", message.guild.id);
    if (!task) {
      return message.reply(
        "A purgecat task is already in progress for this server."
      );
    }

    try {
      const rateLimiter = new RateLimitManager(5, 5000); // Batch size: 5, Delay: 5 seconds
      let deleted = 0;
      let failed = 0;
      let isCancelled = false;

      const channelsToDelete = Array.from(category.children.values());

      if (channelsToDelete.length === 0) {
        return message.channel.send(
          `> ❌ No channels found in category "${category.name}".`
        );
      }

      // Create status message
      const statusMsg = await message.channel.send(
        `> ⏳ Deleting ${channelsToDelete.length} channels from ${category.name}...`
      );

      // Add cancellation listener
      if (task.signal) {
        task.signal.addEventListener("abort", () => {
          if (!task.signal.reason || task.signal.reason !== "completed") {
            isCancelled = true;
            statusMsg
              .edit(
                `> ⚠️ Category purge cancelled after deleting ${deleted} channels.`
              )
              .catch(() => {});
          }
        });
      }

      for (const channel of channelsToDelete) {
        if (task.signal.aborted) break;

        await rateLimiter.execute(async () => {
          if (task.signal.aborted) return;
          return channel
            .delete({ reason: "Category purge initiated by selfbot" })
            .catch((err) => {
              log(
                `Failed to delete channel ${channel.name} (${channel.id}): ${err.message}`,
                "error"
              );
              failed++;
            });
        }, task.signal);
        deleted++;
      }

      if (!isCancelled) {
        statusMsg
          .edit(
            `> ✅ Deleted ${deleted} channels from ${category.name}. Failed: ${failed}`
          )
          .catch(() => {});
      }
    } catch (error) {
      log(`Error during category purge: ${error.message}`, "error");
      message.channel.send("> ❌ Error purging category.");
    } finally {
      task.stop();
    }
  },
};
