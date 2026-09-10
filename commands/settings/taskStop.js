import { log, style, formatAnsiBlock } from "../../utils/functions.js";
import { THEME } from "../../utils/theme.js";
import TaskManager from "../../utils/TaskManager.js";

export default {
  name: "taskstop",
  description: "Stop active tasks",
  aliases: ["stopall", "stoptasks", "taskscleanup"],
  usage: "taskstop [taskName]",
  category: "settings",
  type: "both",
  ownerOnly: true,
  permissions: ["SendMessages"],
  cooldown: 5,

  async execute(client, message, args) {
    if (args[0] && ["help", "--help", "-h"].includes(args[0].toLowerCase())) {
      return message.channel.send(`> **Taskstop Help**\n> Usage: \`${client.prefix}taskstop [taskName]\`\n> Aliases: \`${client.prefix}stopall\`, \`${client.prefix}stoptasks\`, \`${client.prefix}taskscleanup\``);
    }

    try {
      // Check if a specific task name was provided
      const specificTask = args.length > 0 ? args[0].toLowerCase() : null;

      const statusMsg = await message.channel.send(
        formatAnsiBlock([
          style(`Barro`, THEME.HEADER_BOLD_COLOR) + style(` Tasks | Stop`, THEME.ACCENT_COLOR),
          specificTask
            ? style(`Stopping tasks matching "${specificTask}"...`, THEME.LABEL_COLOR)
            : style(`Stopping all active tasks...`, THEME.LABEL_COLOR)
        ])
      );

      // Get current task count
      const taskCount = TaskManager.tasks.size;

      if (taskCount === 0) {
        await statusMsg.edit(
          formatAnsiBlock([
            style(`Barro`, THEME.HEADER_BOLD_COLOR) + style(` Tasks | Stop`, THEME.ACCENT_COLOR),
            style(`✅ No active tasks found to stop.`, THEME.ACCENT_COLOR)
          ])
        );
        return;
      }

      // Filter tasks if a specific name was provided
      const taskIds = Array.from(TaskManager.tasks.keys());
      const tasksToStop = specificTask
        ? taskIds.filter((id) => id.toLowerCase().includes(specificTask))
        : taskIds;

      if (tasksToStop.length === 0) {
        await statusMsg.edit(
          formatAnsiBlock([
            style(`Barro`, THEME.HEADER_BOLD_COLOR) + style(` Tasks | Stop`, THEME.ACCENT_COLOR),
            style(`❌ No tasks found matching "${specificTask}".`, THEME.LABEL_COLOR)
          ])
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
        formatAnsiBlock([
          style(`Barro`, THEME.HEADER_BOLD_COLOR) + style(` Tasks | Stop`, THEME.ACCENT_COLOR),
          style(`Stopping ${tasksToStop.length} active tasks...`, THEME.LABEL_COLOR),
          '',
          style(`Tasks to stop:`, THEME.HEADER_BOLD_COLOR),
          ...taskList.map(t => style(t, THEME.LABEL_COLOR))
        ])
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
      const finalLines = [
        style(`Barro`, THEME.HEADER_BOLD_COLOR) + style(` Tasks | Stop`, THEME.ACCENT_COLOR),
        style(`✅ Task cleanup completed!`, THEME.ACCENT_COLOR)
      ];

      if (stoppedCount > 0) {
        finalLines.push('');
        finalLines.push(style(`Successfully stopped ${stoppedCount} tasks:`, THEME.HEADER_BOLD_COLOR));
        stoppedTasks.forEach(t => finalLines.push(style(t, THEME.LABEL_COLOR)));
      }

      if (failedCount > 0) {
        finalLines.push('');
        finalLines.push(style(`Failed to stop ${failedCount} tasks:`, THEME.HEADER_BOLD_COLOR));
        failedTasks.forEach(t => finalLines.push(style(t, THEME.LABEL_COLOR)));
      }

      await statusMsg.edit(formatAnsiBlock(finalLines));

      log(
        `Task cleanup completed. Stopped ${stoppedCount} tasks. Failed: ${failedCount}`,
        "success"
      );
    } catch (error) {
      log(`Error stopping tasks: ${error.message}`, "error");
      await message.channel.send(
        formatAnsiBlock([
          style(`Barro`, THEME.HEADER_BOLD_COLOR) + style(` Tasks | Stop`, THEME.ACCENT_COLOR),
          style(`❌ Error stopping tasks!`, THEME.LABEL_COLOR),
          style(`Error: ${error.message}`, THEME.ACCENT_COLOR)
        ])
      );
    }
  },
};
