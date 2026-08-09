/**
 * RAW EVENT HANDLER
 *
 * This event handler captures and processes raw Discord gateway events
 * before they are processed by Discord.js. It's primarily used for:
 * - Debugging Discord gateway communication
 * - Logging relationship and presence events
 * - Monitoring specific Discord events that may not be fully supported
 * - Development and troubleshooting purposes
 *
 * The handler only operates when debug mode is enabled in the configuration
 * to avoid unnecessary processing and logging in production environments.
 *
 * @module events/raw
 * @author lilbarro
 */

import { log } from "../utils/functions.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get current file paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize debug directory for raw event logging
const debugDir = path.join(__dirname, "..", "data", "debug");
if (!fs.existsSync(debugDir)) {
  fs.mkdirSync(debugDir, { recursive: true });
}

export default {
  name: "raw",
  once: false,

  /**
   * Process raw Discord gateway events for debugging and monitoring
   *
   * @async
   * @function execute
   * @param {Client} client - Discord.js client instance
   * @param {Object} packet - Raw Discord gateway packet data
   * @description Captures raw Discord events and logs specific relationship
   *              and presence events when debug mode is enabled. Useful for
   *              monitoring Discord API changes and debugging issues.
   */
  execute: async (client, packet) => {
    // Only process raw events when debug mode is explicitly enabled
    if (client.config.debug_mode && client.config.debug_mode.enabled) {
      // Define relationship and presence events we want to monitor
      const relationshipEvents = [
        "RELATIONSHIP_ADD", // Friend request sent/received
        "RELATIONSHIP_REMOVE", // Friend removed or request declined
        "RELATIONSHIP_UPDATE", // Relationship status changed
        "PRESENCE_UPDATE", // User status/activity changed
        "USER_UPDATE", // User profile updated
        "GUILD_CREATE", // Joined a server
        "GUILD_DELETE", // Left a server or server deleted
      ];

      // Only log events we're interested in to reduce noise
      if (relationshipEvents.includes(packet.t)) {
        // Log event type to console for immediate feedback
        log(`[RAW EVENT] ${packet.t}`, "debug");

        // Log detailed event data to file for later analysis
        try {
          const logFile = path.join(debugDir, "raw_events.log");
          const timestamp = new Date().toISOString();
          const logEntry = `[${timestamp}] ${packet.t}: ${JSON.stringify(
            packet.d,
            null,
            2
          )}\n`;
          fs.appendFileSync(logFile, logEntry);
        } catch (error) {
          console.error("Failed to write raw event to log file:", error);
        }
      }
    }
  },
};
