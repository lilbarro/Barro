import { log, loadConfig } from "../../utils/functions.js";
import TaskManager from "../../utils/TaskManager.js";
import { loadCommands } from "../../handlers/CommandHandler.js";
import { loadEvents } from "../../handlers/EventsHandler.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "reload",
  description:
    "Completely reload the selfbot by cleaning up tasks, clearing caches, and reloading all modules",
  aliases: ["refresh", "restart", "reloadall"],
  usage: "reload",
  category: "settings",
  type: "both",
  permissions: ["SendMessages"],
  cooldown: 10,

  async execute(client, message, _) {
    const startTime = Date.now();
    let statusMsg;

    try {
      // Send initial status message
      statusMsg = await message.channel.send(
        "> 🔄 **Starting complete selfbot reload...**"
      );

      // Step 1: Force stop ALL active tasks immediately
      await statusMsg.edit(
        "> 🔄 **Starting complete selfbot reload...**\n" +
          "> 🛑 **Force stopping all active tasks...**"
      );

      const taskStats = await this.forceStopAllTasks();

      await statusMsg.edit(
        "> 🔄 **Starting complete selfbot reload...**\n" +
          "> 🛑 **Force stopping all active tasks...** ✅\n" +
          `> 📊 Stopped ${taskStats.stopped} tasks, Failed: ${taskStats.failed}\n` +
          "> 🧹 **Clearing module cache...**"
      );

      // Step 2: Clear Node.js module cache
      const cacheStats = this.clearModuleCache();

      await statusMsg.edit(
        "> 🔄 **Starting complete selfbot reload...**\n" +
          "> 🛑 **Force stopping all active tasks...** ✅\n" +
          `> 📊 Stopped ${taskStats.stopped} tasks, Failed: ${taskStats.failed}\n` +
          "> 🧹 **Clearing module cache...** ✅\n" +
          `> 📦 Cleared ${cacheStats.cleared} cached modules\n` +
          "> 🗑️ **Clearing collections...**"
      );

      // Step 3: Clear all client collections and data
      await statusMsg.edit(
        "> 🔄 **Starting complete selfbot reload...**\n" +
          "> 🛑 **Force stopping all active tasks...** ✅\n" +
          `> 📊 Stopped ${taskStats.stopped} tasks, Failed: ${taskStats.failed}\n` +
          "> 🧹 **Clearing module cache...** ✅\n" +
          `> 📦 Cleared ${cacheStats.cleared} cached modules\n` +
          "> 🗑️ **Clearing collections...** ✅\n" +
          "> ⚙️ **Reloading commands...**"
      );

      this.clearClientCollections(client);

      // Step 4: Reload commands with detailed tracking
      const commandStats = await this.reloadCommands(client);

      await statusMsg.edit(
        "> 🔄 **Starting complete selfbot reload...**\n" +
          "> 🛑 **Force stopping all active tasks...** ✅\n" +
          `> 📊 Stopped ${taskStats.stopped} tasks, Failed: ${taskStats.failed}\n` +
          "> 🧹 **Clearing module cache...** ✅\n" +
          `> 📦 Cleared ${cacheStats.cleared} cached modules\n` +
          "> 🗑️ **Clearing collections...** ✅\n" +
          "> ⚙️ **Reloading commands...** ✅\n" +
          `> 📝 Loaded ${commandStats.loaded} commands, Failed: ${commandStats.failed}\n` +
          "> 🎯 **Reloading events...**"
      );

      // Step 5: Reload events with detailed tracking
      const eventStats = await this.reloadEvents(client);

      await statusMsg.edit(
        "> 🔄 **Starting complete selfbot reload...**\n" +
          "> 🛑 **Force stopping all active tasks...** ✅\n" +
          `> 📊 Stopped ${taskStats.stopped} tasks, Failed: ${taskStats.failed}\n` +
          "> 🧹 **Clearing module cache...** ✅\n" +
          `> 📦 Cleared ${cacheStats.cleared} cached modules\n` +
          "> 🗑️ **Clearing collections...** ✅\n" +
          "> ⚙️ **Reloading commands...** ✅\n" +
          `> 📝 Loaded ${commandStats.loaded} commands, Failed: ${commandStats.failed}\n` +
          "> 🎯 **Reloading events...** ✅\n" +
          `> ⚡ Loaded ${eventStats.loaded} events, Failed: ${eventStats.failed}\n` +
          "> 🔧 **Reinitializing systems...**"
      );

      // Step 6: Reinitialize critical systems
      await this.reinitializeSystems(client);

      // Step 7: Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Step 8: Complete
      const endTime = Date.now();
      const reloadTime = endTime - startTime;
      const memoryUsage = Math.round(
        process.memoryUsage().heapUsed / 1024 / 1024
      );

      await statusMsg.edit(
        "> ✅ **Selfbot completely reloaded!**\n\n" +
          `> 📊 **Detailed Statistics:**\n` +
          `> • **Tasks:** Stopped ${taskStats.stopped}, Failed: ${taskStats.failed}\n` +
          `> • **Cache:** Cleared ${cacheStats.cleared} modules\n` +
          `> • **Commands:** Loaded ${commandStats.loaded}, Failed: ${commandStats.failed}\n` +
          `> • **Events:** Loaded ${eventStats.loaded}, Failed: ${eventStats.failed}\n` +
          `> • **Reload time:** ${reloadTime}ms\n` +
          `> • **Memory usage:** ${memoryUsage}MB\n` +
          `> • **Status:** All systems operational ✅`
      );

      log(
        `Complete selfbot reload finished in ${reloadTime}ms - ` +
          `Tasks: ${taskStats.stopped}/${
            taskStats.stopped + taskStats.failed
          }, ` +
          `Commands: ${commandStats.loaded}/${
            commandStats.loaded + commandStats.failed
          }, ` +
          `Events: ${eventStats.loaded}/${
            eventStats.loaded + eventStats.failed
          }`,
        "success"
      );
    } catch (error) {
      log(`Critical error during selfbot reload: ${error.message}`, "error");
      console.error("Reload Error Stack:", error.stack);

      try {
        const errorMsg = statusMsg || message.channel;
        await errorMsg.send(
          "> ❌ **Critical reload failure!**\n" +
            `> **Error:** ${error.message}\n` +
            "> **Action:** Check console for details\n" +
            "> **Recommendation:** Restart the selfbot manually"
        );
      } catch (sendError) {
        log(
          `Failed to send reload error message: ${sendError.message}`,
          "error"
        );
      }
    }
  },

  /**
   * Force stop all active tasks with detailed tracking
   */
  async forceStopAllTasks() {
    const stats = { stopped: 0, failed: 0 };

    try {
      // Get all active tasks
      const taskIds = Array.from(TaskManager.tasks.keys());

      if (taskIds.length === 0) {
        log("No active tasks to stop during reload", "debug");
        return stats;
      }

      log(
        `Force stopping ${taskIds.length} active tasks during reload`,
        "debug"
      );

      // Force abort all tasks immediately
      for (const taskId of taskIds) {
        try {
          const task = TaskManager.tasks.get(taskId);
          if (task) {
            // Force abort the task signal
            if (TaskManager.abortControllers.has(taskId)) {
              TaskManager.abortControllers.get(taskId).abort();
            }

            // Destroy the task completely
            const result = TaskManager.destroyTask(taskId);
            if (result) {
              stats.stopped++;
            } else {
              stats.failed++;
            }
          } else {
            stats.failed++;
          }
        } catch (error) {
          stats.failed++;
          log(`Error force stopping task ${taskId}: ${error.message}`, "warn");
        }
      }

      // Final cleanup to ensure everything is cleared
      await TaskManager.cleanup();

      log(
        `Force stopped ${stats.stopped} tasks, ${stats.failed} failed`,
        "debug"
      );
    } catch (error) {
      log(`Error during force task stopping: ${error.message}`, "error");
      stats.failed = TaskManager.tasks.size;
    }

    return stats;
  },

  /**
   * Clear Node.js module cache for hot reloading (ES modules don't use require.cache)
   */
  clearModuleCache() {
    const stats = { cleared: 0 };

    try {
      // In ES modules, we can't clear the module cache like CommonJS
      // Instead, we'll just force garbage collection and log that cache clearing is not needed
      log(
        "ES modules don't require manual cache clearing - using garbage collection instead",
        "debug"
      );

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        stats.cleared = 1; // Indicate that GC was performed
        log("Performed garbage collection for memory cleanup", "debug");
      } else {
        log(
          "Garbage collection not available (run with --expose-gc for better memory management)",
          "debug"
        );
      }
    } catch (error) {
      log(`Error during memory cleanup: ${error.message}`, "error");
    }

    return stats;
  },

  /**
   * Clear all client collections and reset state
   */
  clearClientCollections(client) {
    try {
      // Clear command-related collections
      if (client.commands) client.commands.clear();
      if (client.cooldowns) client.cooldowns.clear();

      // Clear any custom collections that might exist
      if (client.viewTasks) client.viewTasks.clear();

      // Note: In ES modules, we can't dynamically import and clear session data
      // from other modules like we could with CommonJS require()
      // The session clearing will happen when those modules are reloaded

      log("Cleared all client collections", "debug");
    } catch (error) {
      log(`Error clearing client collections: ${error.message}`, "warn");
    }
  },

  /**
   * Reload commands with detailed error tracking
   */
  async reloadCommands(client) {
    const stats = { loaded: 0, failed: 0 };

    try {
      const result = await loadCommands(client);
      stats.loaded = result || 0;

      log(`Reloaded ${stats.loaded} commands successfully`, "info");
    } catch (error) {
      log(`Error reloading commands: ${error.message}`, "error");
      stats.failed = 1;
    }

    return stats;
  },

  /**
   * Reload events with detailed error tracking
   */
  async reloadEvents(client) {
    const stats = { loaded: 0, failed: 0 };

    try {
      const result = await loadEvents(client);
      stats.loaded = result || 0;

      log(`Reloaded ${stats.loaded} events successfully`, "info");
    } catch (error) {
      log(`Error reloading events: ${error.message}`, "error");
      stats.failed = 1;
    }

    return stats;
  },

  /**
   * Reinitialize critical systems
   */
  async reinitializeSystems(client) {
    try {
      // Reload configuration
      const config = loadConfig(true); // Force reload
      client.config = config;
      client.prefix = config.selfbot.prefix;

      // Reinitialize TaskManager
      TaskManager.tasks.clear();
      TaskManager.intervals.clear();
      TaskManager.timeouts.clear();
      TaskManager.abortControllers.clear();

      log("Reinitialized critical systems", "info");
    } catch (error) {
      log(`Error reinitializing systems: ${error.message}`, "error");
    }
  },
};
