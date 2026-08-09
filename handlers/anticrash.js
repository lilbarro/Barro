/**
 * ANTI-CRASH HANDLER
 *
 * This module provides comprehensive error handling to prevent the selfbot
 * from crashing due to unhandled exceptions and promise rejections.
 *
 * Features:
 * - Catches uncaught exceptions and logs them safely
 * - Handles unhandled promise rejections
 * - Filters and logs warnings appropriately
 * - Maintains bot stability during errors
 * - Logs all errors to file for debugging
 *
 * The anti-crash system ensures the selfbot continues running even when
 * unexpected errors occur, which is crucial for 24/7 operation.
 *
 * @module handlers/anticrash
 * @author lilbarro
 */

import chalk from "chalk";
import { log, logError } from "../utils/functions.js";

/**
 * Setup comprehensive error handling to prevent bot crashes
 *
 * @function setupAntiCrash
 * @param {Client} client - Discord.js client instance
 * @description Registers global error handlers for uncaught exceptions,
 *              unhandled promise rejections, and process warnings.
 *              All errors are logged to file while keeping the bot running.
 *
 * @example
 * // Initialize anti-crash system
 * setupAntiCrash(client);
 */
export function setupAntiCrash(client) {
  /**
   * Handle uncaught exceptions that would normally crash the process
   *
   * @event process#uncaughtException
   * @param {Error} error - The uncaught exception
   * @description Catches any unhandled errors in the application and logs them
   *              to file instead of letting the process crash. This is essential
   *              for maintaining 24/7 uptime.
   */
  process.on("uncaughtException", (error) => {
    // Log the full error details to file for debugging
    logError(error, "Uncaught Exception");

    // Notify console that an error occurred without spamming details
    log("Uncaught exception occurred and has been logged to file", "warn");

    // Check if Discord client is still functional
    if (client.isReady() && client.user) {
      log("Client is still connected, continuing despite error...", "warn");

      // Optional: Send error notification to a logging channel
      // This can be useful for monitoring bot health remotely
      // if (client.channels.cache.has(logChannelId)) {
      //     client.channels.cache.get(logChannelId).send(`Error: ${error.message}`);
      // }
    }
  });

  /**
   * Handle unhandled promise rejections
   *
   * @event process#unhandledRejection
   * @param {*} reason - The rejection reason (usually an Error object)
   * @param {Promise} promise - The promise that was rejected
   * @description Catches promises that are rejected but not handled with .catch()
   *              This prevents the "UnhandledPromiseRejectionWarning" and potential
   *              process termination in newer Node.js versions.
   */
  process.on("unhandledRejection", (reason, promise) => {
    // Log the rejection details to file
    logError(reason, "Unhandled Promise Rejection");

    // Notify console about the rejection
    log(
      "Unhandled promise rejection occurred and has been logged to file",
      "warn"
    );

    // Verify client is still operational
    if (client.isReady() && client.user) {
      log("Client is still connected, continuing despite rejection...", "warn");
    }
  });

  /**
   * Handle process warnings (deprecations, experimental features, etc.)
   *
   * @event process#warning
   * @param {Warning} warning - The warning object
   * @description Filters and handles various Node.js warnings. Important warnings
   *              are shown in console while all warnings are logged to file.
   *              This helps reduce console spam from experimental features.
   */
  process.on("warning", (warning) => {
    // Filter out common non-critical warnings to reduce console noise
    if (
      warning.name !== "ExperimentalWarning" &&
      warning.name !== "DeprecationWarning"
    ) {
      log(`Warning: ${warning.name} - ${warning.message}`, "warn");
    }

    // Log all warnings to file for complete debugging information
    logError(warning, "Warning");
  });

  log("Anti-crash system initialized", "success");
}
