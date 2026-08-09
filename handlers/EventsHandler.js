/**
 * EVENTS HANDLER
 *
 * This module handles the loading and registration of all Discord event listeners.
 * It provides automatic event discovery and registration with support for:
 * - One-time events (client.once) and recurring events (client.on)
 * - Recursive directory scanning for organized event files
 * - Event validation and error handling
 * - Automatic client parameter injection
 * - Loading statistics and categorization
 *
 * Events are organized in the events directory and can be nested in subdirectories
 * for better organization (e.g., events/relationship/, events/guild/).
 *
 * @module handlers/EventsHandler
 * @author lilbarro
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { log } from "../utils/functions.js";

// Get current file path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load and register all event handlers from the events directory
 *
 * @async
 * @function loadEvents
 * @param {Client} client - Discord.js client instance
 * @returns {Promise<number>} Number of successfully loaded events
 * @description Recursively scans the events directory, loads all valid event files,
 *              and registers them with the Discord client. Supports both one-time
 *              and recurring events with automatic client parameter injection.
 *
 * @example
 * // Load all events during bot initialization
 * const eventCount = await loadEvents(client);
 * console.log(`Loaded ${eventCount} events`);
 */
export async function loadEvents(client) {
  try {
    // Get path to events directory
    const eventsDir = path.join(__dirname, "..", "events");

    // Recursively find all event files
    const eventFiles = getEventFiles(eventsDir);

    log(`Loading ${eventFiles.length} events...`, "info");

    let loadedCount = 0;
    const eventTypes = {
      once: 0, // One-time events (like 'ready')
      on: 0, // Recurring events (like 'messageCreate')
    };

    // Process each event file
    for (const filePath of eventFiles) {
      try {
        // Dynamically import the event module
        const event = await import(`file://${filePath}`);

        // Validate event structure
        if (!event.default || !event.default.name || !event.default.execute) {
          log(
            `Skipping invalid event file: ${path.basename(filePath)}`,
            "warn"
          );
          continue;
        }

        // Extract event properties
        const { name, once, execute } = event.default;

        // Register event with appropriate method
        if (once) {
          // One-time event (fires only once, like 'ready')
          client.once(name, (...args) => execute(client, ...args));
          eventTypes.once++;
        } else {
          // Recurring event (fires multiple times, like 'messageCreate')
          client.on(name, (...args) => execute(client, ...args));
          eventTypes.on++;
        }

        loadedCount++;
        log(`Loaded event: ${name} (${once ? "once" : "on"})`, "success");
      } catch (error) {
        log(
          `Error loading event file ${path.basename(filePath)}: ${
            error.message
          }`,
          "error"
        );
      }
    }

    // Log summary
    log(
      `Successfully loaded ${loadedCount} events (${eventTypes.on} on, ${eventTypes.once} once)`,
      "success"
    );

    return loadedCount;
  } catch (error) {
    log(`Error loading events: ${error.message}`, "error");
    return 0;
  }
}

/**
 * Recursively gets all event files from the events directory
 * @param {string} directory - Directory to search for event files
 * @param {Array} files - Array to store found files
 * @returns {Array} Array of event file paths
 */
function getEventFiles(directory, files = []) {
  const items = fs.readdirSync(directory, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(directory, item.name);

    if (item.isDirectory()) {
      // Pass the same files array to accumulate results
      getEventFiles(fullPath, files);
    } else if (item.name.endsWith(".js")) {
      files.push(fullPath);
    }
  }

  return files;
}
