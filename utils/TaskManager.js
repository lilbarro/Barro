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
  /**
   * Initialize the TaskManager
   *
   * @constructor
   * @description Sets up the internal data structures for tracking tasks,
   *              intervals, timeouts, and abort controllers.
   */
  constructor() {
    // Map to store active tasks: taskId -> task object
    this.tasks = new Map();

    // Map to store intervals associated with tasks: taskId -> Set of intervalIds
    this.intervals = new Map();

    // Map to store timeouts associated with tasks: taskId -> Set of timeoutIds
    this.timeouts = new Map();

    // Map to store abort controllers for task cancellation: taskId -> AbortController
    this.abortControllers = new Map();

    log("Task Manager initialized.", "info");
  }

  /**
   * Create a new managed task
   *
   * @method createTask
   * @param {string} name - The name/type of the task (e.g., 'stalk', 'spam', 'monitor')
   * @param {string} guildId - The guild ID where the task is running (use 'global' for non-guild tasks)
   * @returns {Object|null} Task object with management methods, or null if task already exists
   *
   * @description Creates a new task with automatic resource management.
   *              Each task gets its own abort controller for cancellation
   *              and methods to register intervals/timeouts for cleanup.
   *
   * @example
   * // Create a stalking task
   * const stalkTask = TaskManager.createTask('stalk', message.guild.id);
   * if (stalkTask) {
   *   // Use the task's abort signal for fetch operations
   *   const response = await fetch(url, { signal: stalkTask.signal });
   * }
   */
  createTask(name, guildId) {
    // Generate unique task ID combining name and guild
    const taskId = `${name}:${guildId}`;

    // Check if task already exists to prevent duplicates
    if (this.tasks.has(taskId)) {
      log(`Task ${taskId} already exists.`, "warn");
      return null;
    }

    // Create abort controller for graceful task cancellation
    const abortController = new AbortController();
    this.abortControllers.set(taskId, abortController);

    // Create task object with management methods
    const task = {
      // Basic task information
      id: taskId,
      name,
      guildId,
      startTime: Date.now(),
      status: "running",
      signal: abortController.signal, // For fetch operations and other cancellable operations

      /**
       * Register an interval with this task for automatic cleanup
       *
       * @method registerInterval
       * @param {number} intervalId - The interval ID returned by setInterval()
       * @returns {number} The same interval ID for chaining
       *
       * @example
       * const intervalId = setInterval(callback, 1000);
       * task.registerInterval(intervalId);
       */
      registerInterval: (intervalId) => {
        if (!this.intervals.has(taskId)) {
          this.intervals.set(taskId, new Set());
        }
        this.intervals.get(taskId).add(intervalId);
        return intervalId;
      },

      /**
       * Register a timeout with this task for automatic cleanup
       *
       * @method registerTimeout
       * @param {number} timeoutId - The timeout ID returned by setTimeout()
       * @returns {number} The same timeout ID for chaining
       *
       * @example
       * const timeoutId = setTimeout(callback, 5000);
       * task.registerTimeout(timeoutId);
       */
      registerTimeout: (timeoutId) => {
        if (!this.timeouts.has(taskId)) {
          this.timeouts.set(taskId, new Set());
        }
        this.timeouts.get(taskId).add(timeoutId);
        return timeoutId;
      },

      /**
       * Stop the task normally (completed successfully)
       *
       * @method stop
       * @returns {boolean} True if task was stopped successfully
       *
       * @example
       * // Stop the task when work is complete
       * task.stop();
       */
      stop: () => {
        return this.destroyTask(taskId, "completed");
      },

      /**
       * Abort all operations associated with this task
       *
       * @method abort
       * @description Triggers the abort signal for all fetch operations
       *              and other cancellable operations using this task's signal
       *
       * @example
       * // Cancel all ongoing operations
       * task.abort();
       */
      abort: () => {
        abortController.abort();
      },
    };

    // Store the task in our tracking map
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
      // Task might have already been destroyed or never existed
      // This is normal during cleanup operations, so log as debug instead of warn
      log(
        `Task ${taskId} not found for destruction (already cleaned up).`,
        "debug"
      );
      return false;
    }

    const task = this.tasks.get(taskId);
    log(`Destroying task ${taskId} (${task.name})...`, "debug");

    let intervalsCleared = 0;
    let timeoutsCleared = 0;

    // Clear all intervals associated with this task
    if (this.intervals.has(taskId)) {
      const intervalSet = this.intervals.get(taskId);
      for (const intervalId of intervalSet) {
        try {
          clearInterval(intervalId);
          intervalsCleared++;
        } catch (error) {
          log(
            `Error clearing interval ${intervalId} for task ${taskId}: ${error.message}`,
            "warn"
          );
        }
      }
      this.intervals.delete(taskId);
    }

    // Clear all timeouts associated with this task
    if (this.timeouts.has(taskId)) {
      const timeoutSet = this.timeouts.get(taskId);
      for (const timeoutId of timeoutSet) {
        try {
          clearTimeout(timeoutId);
          timeoutsCleared++;
        } catch (error) {
          log(
            `Error clearing timeout ${timeoutId} for task ${taskId}: ${error.message}`,
            "warn"
          );
        }
      }
      this.timeouts.delete(taskId);
    }

    // Abort any fetch operations
    if (this.abortControllers.has(taskId)) {
      try {
        const controller = this.abortControllers.get(taskId);
        if (!controller.signal.aborted) {
          // Use the abort reason parameter directly without trying to set a custom property
          controller.abort(reason);
        }
      } catch (error) {
        log(
          `Error aborting operations for task ${taskId}: ${error.message}`,
          "warn"
        );
      }
      this.abortControllers.delete(taskId);
    }

    // Remove the task from the tasks map
    this.tasks.delete(taskId);
    log(
      `Task ${taskId} destroyed successfully. Cleared ${intervalsCleared} intervals, ${timeoutsCleared} timeouts.`,
      "debug"
    );
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

    log(
      `Task cleanup completed. Success: ${successCount}, Failed: ${failCount}`,
      "success"
    );
  }

  createInterval(taskId, callback, delay) {
    if (!this.tasks.has(taskId)) {
      log(
        `Task ${taskId} not found for interval creation - task may have been destroyed`,
        "warn"
      );
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
      // Task was already destroyed, silently return null instead of throwing
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
