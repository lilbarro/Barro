/**
 * RATE LIMIT MANAGER MODULE
 *
 * This module provides intelligent rate limiting for Discord API operations
 * to prevent hitting Discord's rate limits and getting temporarily banned.
 *
 * Features:
 * - Dynamic concurrency adjustment based on rate limit hits
 * - Automatic retry with exponential backoff
 * - Queue management for pending operations
 * - Cancellation support via AbortSignal
 * - Statistics tracking for optimization
 *
 * The manager automatically reduces concurrency when rate limits are hit
 * and gradually increases it when operations are successful.
 *
 * @module utils/RateLimitManager
 * @author lilbarro
 */

import { log } from "./functions.js";

/**
 * RateLimitManager Class
 *
 * Manages API request concurrency and handles rate limiting intelligently.
 * Automatically adjusts the number of concurrent operations based on
 * Discord's rate limit responses.
 *
 * @class RateLimitManager
 * @description Prevents Discord API rate limits through intelligent
 *              concurrency management and automatic retry logic.
 */
export default class RateLimitManager {
  /**
   * Initialize the Rate Limit Manager
   *
   * @constructor
   * @param {number} initialConcurrency - Starting number of concurrent operations (default: 10)
   *
   * @description Sets up the rate limiting system with configurable initial concurrency.
   *              The manager will automatically adjust this value based on API responses.
   */
  constructor(initialConcurrency = 1) {
    // Concurrency control settings
    this.maxConcurrency = initialConcurrency; // Current maximum concurrent operations
    this.activeOperations = 0; // Number of currently running operations
    this.minConcurrency = 1; // Minimum allowed concurrency (safety limit)
    this.maxAllowedConcurrency = 2; // Maximum allowed concurrency (safety limit)

    // Task queue management
    this.queue = []; // Queue of pending tasks waiting to execute

    // Statistics tracking for optimization
    this.successfulOperations = 0; // Count of successful operations (no rate limits)
    this.rateLimitHits = 0; // Count of rate limit encounters

    log(
      `Rate Limit Manager initialized with concurrency: ${initialConcurrency}`,
      "debug"
    );
  }

  /**
   * Execute a task while respecting rate limits and handling cancellation
   *
   * @method execute
   * @param {Function} task - The asynchronous task to execute (should return a Promise)
   * @param {AbortSignal} [signal] - Optional abort signal for cancellation support
   * @returns {Promise} Promise that resolves with the task result or rejects with an error
   *
   * @description This is the main method for executing API operations through the rate limiter.
   *              It handles queuing, concurrency limits, rate limit detection, automatic retries,
   *              and cancellation support. The method will automatically retry on rate limits
   *              and adjust concurrency to prevent future rate limit hits.
   *
   * @example
   * // Execute a Discord API call with rate limiting
   * const result = await rateLimitManager.execute(async () => {
   *   return await discordAPI.sendMessage(channelId, content);
   * });
   *
   * // Execute with cancellation support
   * const abortController = new AbortController();
   * const result = await rateLimitManager.execute(async () => {
   *   return await fetch(url, { signal: abortController.signal });
   * }, abortController.signal);
   */
  async execute(task, signal = null) {
    return new Promise((resolve, reject) => {
      // Pre-execution cancellation check
      if (signal?.aborted) {
        reject(new Error("Operation was cancelled"));
        return;
      }

      /**
       * Wrapped task execution with rate limiting logic
       *
       * @inner
       * @async
       * @function wrappedTask
       * @description Handles the actual task execution with concurrency tracking,
       *              error handling, and rate limit detection.
       */
      const wrappedTask = async () => {
        // Check for cancellation before starting execution
        if (signal?.aborted) {
          reject(new Error("Operation was cancelled"));
          return;
        }

        // Increment active operations counter
        this.activeOperations++;

        try {
          // Execute the actual task
          const result = await task();

          // Track successful operation for concurrency adjustment
          this.successfulOperations++;

          // Final cancellation check before resolving
          if (signal?.aborted) {
            reject(new Error("Operation was cancelled"));
          } else {
            resolve(result);
          }
        } catch (err) {
          // Handle cancellation during execution
          if (signal?.aborted) {
            reject(new Error("Operation was cancelled"));
            return;
          }

          // Handle different types of rate limit errors
          if (this.isRateLimitError(err)) {
            this.rateLimitHits++;
            const retryAfter = this.extractRetryAfter(err);

            log(
              `Rate limit hit (${
                this.rateLimitHits
              }), reducing concurrency from ${
                this.maxConcurrency
              } to ${Math.max(
                this.minConcurrency,
                Math.floor(this.maxConcurrency / 2)
              )}, retrying after ${retryAfter}ms`,
              "warn"
            );

            // Reduce concurrency more aggressively for webhooks
            this.maxConcurrency = Math.max(
              this.minConcurrency,
              Math.floor(this.maxConcurrency / 2)
            );

            // Wait for the specified retry time before retrying
            const retryTimeout = setTimeout(() => {
              // Check cancellation before retry
              if (signal?.aborted) {
                reject(new Error("Operation was cancelled"));
                return;
              }
              this.execute(task, signal).then(resolve).catch(reject);
            }, retryAfter);

            // Cancel retry if signal is aborted
            if (signal) {
              signal.addEventListener("abort", () => {
                clearTimeout(retryTimeout);
                reject(new Error("Operation was cancelled"));
              });
            }
          } else {
            reject(err); // Re-throw non-rate-limit errors
          }
        } finally {
          this.activeOperations--;
          this.adjustConcurrency(); // Adjust concurrency based on success rate
          this.processQueue();
        }
      };

      // Add cancellation listener
      if (signal) {
        signal.addEventListener("abort", () => {
          reject(new Error("Operation was cancelled"));
        });
      }

      if (this.activeOperations < this.maxConcurrency) {
        wrappedTask(); // Execute immediately if under concurrency limit
      } else {
        // Store task with cancellation support
        const queuedTask = {
          execute: wrappedTask,
          signal: signal,
          cancelled: false,
        };

        this.queue.push(queuedTask);

        // Remove from queue if cancelled
        if (signal) {
          signal.addEventListener("abort", () => {
            queuedTask.cancelled = true;
            const index = this.queue.indexOf(queuedTask);
            if (index > -1) {
              this.queue.splice(index, 1);
            }
          });
        }
      }
    });
  }

  /**
   * Check if an error is a rate limit error
   * @param {Error} error - The error to check
   * @returns {boolean} - True if it's a rate limit error
   */
  isRateLimitError(error) {
    // Check for HTTP 429 status
    if (error.status === 429 || error.response?.status === 429) {
      return true;
    }

    // Check for rate limit in error message
    if (error.message && error.message.toLowerCase().includes("rate limit")) {
      return true;
    }

    // Check for specific Discord rate limit responses
    if (error.response?.data?.retry_after) {
      return true;
    }

    return false;
  }

  /**
   * Extract retry after time from rate limit error
   * @param {Error} error - The rate limit error
   * @returns {number} - Retry after time in milliseconds
   */
  extractRetryAfter(error) {
    // Try to get retry_after from different sources
    let retryAfter = 1000; // Default 1 second

    // From error object directly
    if (error.retry_after) {
      retryAfter = error.retry_after * 1000; // Convert to milliseconds
    }
    // From response data
    else if (error.response?.data?.retry_after) {
      retryAfter = error.response.data.retry_after * 1000;
    }
    // From error message (webhook specific)
    else if (error.message && error.message.includes("Retry after")) {
      const match = error.message.match(/Retry after ([\d.]+)s/);
      if (match) {
        retryAfter = parseFloat(match[1]) * 1000;
      }
    }
    // From response headers
    else if (error.response?.headers?.["retry-after"]) {
      retryAfter = parseFloat(error.response.headers["retry-after"]) * 1000;
    }

    // Ensure minimum retry time and add some jitter
    retryAfter = Math.max(retryAfter, 500); // Minimum 500ms
    retryAfter += Math.random() * 200; // Add 0-200ms jitter

    return Math.ceil(retryAfter);
  }

  /**
   * Adjust concurrency based on success rate
   */
  adjustConcurrency() {
    // Disabled auto-grow: stay at the safe floor. Operators can raise the
    // cap manually if they genuinely need it.
    return;
  }

  /**
   * Process the next task in the queue
   */
  processQueue() {
    while (
      this.queue.length > 0 &&
      this.activeOperations < this.maxConcurrency
    ) {
      const queuedTask = this.queue.shift();

      // Skip cancelled tasks
      if (queuedTask.cancelled || queuedTask.signal?.aborted) {
        continue;
      }

      // Execute the task
      if (typeof queuedTask === "function") {
        // Legacy support for old queue format
        queuedTask();
      } else {
        // New queue format with cancellation support
        queuedTask.execute();
      }
      break;
    }
  }
}
