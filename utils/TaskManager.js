/**
 * TASK MANAGER MODULE
 *
 * This module provides comprehensive task management for long-running operations
 * in the Discord selfbot. It handles:
 * - Task lifecycle management (create, track, destroy)
 * - Interval and timeout management with automatic cleanup
 * - Abort signal handling for graceful cancellation
 * - Resource cleanup to prevent memory leaks
 * - Graceful shutdown support
 *
 * The TaskManager is essential for commands that run continuously (like stalking)
 * or need to be cancelled cleanly when the bot shuts down.
 *
 * @module utils/TaskManager
 * @author lilbarro
 */

import { log } from "./functions.js";

/**
 * TaskManager Class
 *
 * Manages all long-running tasks, intervals, and timeouts in the selfbot.
 * Provides methods to create, track, and clean up tasks properly.
 *
 * @class TaskManager
 * @description Central task management system that prevents memory leaks
 *              and ensures proper cleanup of all running operations.
 */
class TaskManager {
  constructor() {
    // Map to store active tasks: taskId -> task object
    this.tasks = new Map();

    // Map to store intervals associated with tasks: taskId -> Set of intervalIds
    this.intervals = new Map();

    // Map to store timeouts associated with tasks: taskId -> Set of timeoutIds
    this.timeouts = new Map();

    // Map to store abort controllers for task cancellation: taskId -> AbortController
    this.abortControllers = new Map();

    // Memory Guard: periodically clean up potentially leaked tasks every hour
    setInterval(() => this.pruneStaleTasks(), 3600000);

    log("Task Manager initialized.", "info");
  }

  pruneStaleTasks() {
    const now = Date.now();
    let prunedCount = 0;
    for (const [taskId, task] of this.tasks.entries()) {
      // If a task has been running for more than 24 hours, it might be a leak
      if (now - task.startTime > 86400000) {
        this.destroyTask(taskId, "stale_cleanup");
        prunedCount++;
      }
    }
    if (prunedCount > 0) log(`Memory Guard: Pruned ${prunedCount} stale tasks.`, "debug");
  }

  /**
   * Create a new managed task
   *
   * @method createTask
   * @param {string} name - The name/type of the task (e.g., 'stalk', 'spam', 'monitor')
   * @param {string} guildId - The guild ID where the task is running (use 'global' for non-guild tasks)
   * @returns {Object|null} Task object with management methods, or null if task already exists
   */
  createTask(name, guildId) {
    const taskId = `${name}:${guildId}`;

    if (this.tasks.has(taskId)) {
      log(`Task ${taskId} already exists.`, "warn");
      return null;
    }

    const abortController = new AbortController();
    this.abortControllers.set(taskId, abortController);

    const task = {
      id: taskId,
      name,
      guildId,
      startTime: Date.now(),
      status: "running",
      signal: abortController.signal,

      registerInterval: (intervalId) => {
        if (!this.intervals.has(taskId)) {
          this.intervals.set(taskId, new Set());
        }
        this.intervals.get(taskId).add(intervalId);
        return intervalId;
      },

      registerTimeout: (timeoutId) => {
        if (!this.timeouts.has(taskId)) {
          this.timeouts.set(taskId, new Set());
        }
        this.timeouts.get(taskId).add(timeoutId);
        return timeoutId;
      },

      stop: () => {
        return this.destroyTask(taskId, "completed");
      },

      abort: () => {
        abortController.abort();
      },
    };

    this.tasks.set(taskId, task);
    log(`Task ${taskId} created.`, "debug");
    return task;
  }

  getTask(name, guildId) {
    const taskId = `${name}:${guildId}`;
    return this.tasks.get(taskId);
  }

  hasTask(name, guildId) {
    const taskId = `${name}:${guildId}`;
    return this.tasks.has(taskId);
  }

  destroyTask(taskId, reason = "cancelled") {
    if (!this.tasks.has(taskId)) {
      log(`Task ${taskId} not found for destruction (already cleaned up).`, "debug");
      return false;
    }

    const task = this.tasks.get(taskId);
    log(`Destroying task ${taskId} (${task.name})...`, "debug");

    let intervalsCleared = 0;
    let timeoutsCleared = 0;

    if (this.intervals.has(taskId)) {
      const intervalSet = this.intervals.get(taskId);
      for (const intervalId of intervalSet) {
        try {
          clearInterval(intervalId);
          intervalsCleared++;
        } catch (error) {
          log(`Error clearing interval ${intervalId} for task ${taskId}: ${error.message}`, "warn");
        }
      }
      this.intervals.delete(taskId);
    }

    if (this.timeouts.has(taskId)) {
      const timeoutSet = this.timeouts.get(taskId);
      for (const timeoutId of timeoutSet) {
        try {
          clearTimeout(timeoutId);
          timeoutsCleared++;
        } catch (error) {
          log(`Error clearing timeout ${timeoutId} for task ${taskId}: ${error.message}`, "warn");
        }
      }
      this.timeouts.delete(taskId);
    }

    if (this.abortControllers.has(taskId)) {
      try {
        const controller = this.abortControllers.get(taskId);
        if (!controller.signal.aborted) {
          controller.abort(reason);
        }
      } catch (error) {
        log(`Error aborting operations for task ${taskId}: ${error.message}`, "warn");
      }
      this.abortControllers.delete(taskId);
    }

    this.tasks.delete(taskId);
    log(`Task ${taskId} destroyed successfully. Cleared ${intervalsCleared} intervals, ${timeoutsCleared} timeouts.`, "debug");
    return true;
  }

  async cleanup() {
    log("Cleaning up all tasks...", "info");
    if (this.tasks.size === 0) {
      log("No active tasks to clean up.", "info");
      return;
    }

    const taskIds = Array.from(this.tasks.keys());
    let successCount = 0;
    let failCount = 0;

    for (const taskId of taskIds) {
      try {
        const result = this.destroyTask(taskId);
        if (result) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        failCount++;
        log(`Error cleaning up task ${taskId}: ${error.message}`, "error");
      }
    }

    log(`Task cleanup completed. Success: ${successCount}, Failed: ${failCount}`, "success");
  }

  createInterval(taskId, callback, delay) {
    if (!this.tasks.has(taskId)) {
      log(`Task ${taskId} not found for interval creation`, "warn");
      throw new Error(`Task ${taskId} not found`);
    }

    const intervalId = setInterval(callback, delay);

    if (!this.intervals.has(taskId)) {
      this.intervals.set(taskId, new Set());
    }
    this.intervals.get(taskId).add(intervalId);

    return intervalId;
  }

  createTimeout(taskId, callback, delay) {
    if (!this.tasks.has(taskId)) {
      return null;
    }

    const timeoutId = setTimeout(callback, delay);

    if (!this.timeouts.has(taskId)) {
      this.timeouts.set(taskId, new Set());
    }
    this.timeouts.get(taskId).add(timeoutId);

    return timeoutId;
  }
}

export default new TaskManager();
