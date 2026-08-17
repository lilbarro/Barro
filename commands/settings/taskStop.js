import { log } from "../../utils/functions.js";
import TaskManager from "../../utils/TaskManager.js";

export default {
  name: "taskstop",
  description: "Stop and cleanup all active tasks",
  aliases: ["stopall", "stoptasks", "taskscleanup"],
  usage: "taskstop [taskName]",
  category: "settings",
  type: "both",
  ownerOnly: true,
  permissions: ["SendMessages"],
  cooldown: 5,

  async execute(_, message, args) {
    try {
      // Check if a specific task name was provided
      const specificTask = args.length > 0 ? args[0].toLowerCase() : null;

      const statusMsg = await message.channel.send(
        specificTask
          ? `> ⏹️ **Stopping tasks matching "${specificTask}"...**`
          : "> ⏹️ **Stopping all active tasks...**"
      );

      // Get current task count
      const taskCount = TaskManager.tasks.size;

      if (taskCount === 0) {
        await statusMsg.edit("> ✅ **No active tasks found to stop.**");
        return;
      }

      // Filter tasks if a specific name was provided
      const taskIds = Array.from(TaskManager.tasks.keys());
      const tasksToStop = specificTask
        ? taskIds.filter((id) => id.toLowerCase().includes(specificTask))
        : taskIds;

      if (tasksToStop.length === 0) {
        await statusMsg.edit(
          `> ❌ **No tasks found matching "${specificTask}".**`
        );
        return;
      }

      // List tasks before stopping
      const taskList = [];
      for (const taskId of tasksToStop) {
        const task = TaskManager.tasks.get(taskId);
        if (task) {
          taskList.push(`• ${task.name} (ID: ${task.guildId})`);
        }
      }

      await statusMsg.edit(
        `> ⏹️ **Stopping ${tasksToStop.length} active tasks...**\n\n` +
          `> **Tasks to stop:**\n` +
          `> ${taskList.join("\n> ")}`
      );

      // Stop each task individually
      let stoppedCount = 0;
      let failedCount = 0;
      const stoppedTasks = [];
      const failedTasks = [];

      for (const taskId of tasksToStop) {
        try {
          const task = TaskManager.tasks.get(taskId);
          if (task) {
            // First try to abort any ongoing operations
            if (TaskManager.abortControllers.has(taskId)) {
              try {
                TaskManager.abortControllers.get(taskId).abort();
              } catch (abortError) {
                log(
                  `Error aborting task ${taskId}: ${abortError.message}`,
                  "warn"
                );
              }
            }

            // Then destroy the task completely (manual cancellation)
            const result = TaskManager.destroyTask(taskId, "cancelled");

            if (result) {
              stoppedCount++;
              stoppedTasks.push(`• ${task.name} (ID: ${task.guildId})`);
            } else {
              failedCount++;
              failedTasks.push(`• ${taskId} (Failed to stop)`);
            }
          } else {
            failedCount++;
            failedTasks.push(`• ${taskId} (Task not found)`);
          }
        } catch (error) {
          failedCount++;
          failedTasks.push(`• ${taskId} (Error: ${error.message})`);
          log(`Error stopping task ${taskId}: ${error.message}`, "warn");
        }
      }

      // Build response message
      let responseMsg = `> ✅ **Task cleanup completed!**\n\n`;

      if (stoppedCount > 0) {
        responseMsg += `> **Successfully stopped ${stoppedCount} tasks:**\n`;
        responseMsg += `> ${stoppedTasks.join("\n> ")}\n\n`;
      }

      if (failedCount > 0) {
        responseMsg += `> **Failed to stop ${failedCount} tasks:**\n`;
        responseMsg += `> ${failedTasks.join("\n> ")}\n\n`;
      }

      await statusMsg.edit(responseMsg);

      log(
        `Task cleanup completed. Stopped ${stoppedCount} tasks. Failed: ${failedCount}`,
        "success"
      );
    } catch (error) {
      log(`Error stopping tasks: ${error.message}`, "error");
      await message.channel.send(
        `> ❌ **Error stopping tasks!**\n` + `> **Error:** ${error.message}`
      );
    }
  },
};
