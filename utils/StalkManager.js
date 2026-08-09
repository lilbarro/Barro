import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { log } from "./functions.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class StalkManager {
  constructor() {
    this.stalkedUsers = new Map(); // userId -> { username, tag, startTime, logFile }
    this.stalkDir = path.join(__dirname, "..", "data", "stalk");
    this.initializeStalkDirectory();
    this.loadStalkedUsers();
  }

  /**
   * Initialize the stalk directory
   */
  initializeStalkDirectory() {
    if (!fs.existsSync(this.stalkDir)) {
      fs.mkdirSync(this.stalkDir, { recursive: true });
      log("Created stalk directory", "debug");
    }
  }

  /**
   * Load previously stalked users from files
   */
  loadStalkedUsers() {
    try {
      if (!fs.existsSync(this.stalkDir)) return;

      const files = fs
        .readdirSync(this.stalkDir)
        .filter((file) => file.endsWith(".txt"));

      for (const file of files) {
        const userId = file.replace(".txt", "");
        const filePath = path.join(this.stalkDir, file);

        // Read the first line to get user info
        const content = fs.readFileSync(filePath, "utf8");
        const lines = content.split("\n");
        const firstLine = lines.find((line) =>
          line.includes("STALK SESSION STARTED")
        );

        if (firstLine) {
          const userMatch = firstLine.match(/User: (.+?) \((\d+)\)/);
          if (userMatch) {
            const [, userTag, id] = userMatch;
            const [username] = userTag.split("#");

            this.stalkedUsers.set(userId, {
              username: username,
              tag: userTag,
              startTime: new Date(),
              logFile: filePath,
              active: true,
            });
          }
        }
      }

      if (this.stalkedUsers.size > 0) {
        log(
          `Loaded ${this.stalkedUsers.size} previously stalked users`,
          "debug"
        );
      }
    } catch (error) {
      log(`Error loading stalked users: ${error.message}`, "error");
    }
  }

  /**
   * Start stalking a user
   * @param {string} userId - User ID to stalk
   * @param {Object} userInfo - User information
   * @returns {boolean} - Success status
   */
  startStalking(userId, userInfo) {
    try {
      if (!userId || !userInfo) {
        log("Invalid parameters for startStalking", "error");
        return false;
      }

      if (this.stalkedUsers.has(userId)) {
        log(`Already stalking user ${userId}`, "warn");
        return false; // Already stalking
      }

      const logFile = path.join(this.stalkDir, `${userId}.txt`);
      const startTime = new Date();

      // Create initial log entry with more details
      const initialLog = [
        "=".repeat(80),
        `STALK SESSION STARTED`,
        `User: ${userInfo.tag} (${userId})`,
        `Username: ${userInfo.username}`,
        `Started: ${startTime.toLocaleString()}`,
        `Started (ISO): ${startTime.toISOString()}`,
        `Selfbot: ${userInfo.selfbotTag || "Unknown"}`,
        `Session ID: ${this.generateSessionId()}`,
        "=".repeat(80),
        "",
      ].join("\n");

      fs.writeFileSync(logFile, initialLog, "utf8");

      // Store in memory with additional metadata
      this.stalkedUsers.set(userId, {
        username: userInfo.username,
        tag: userInfo.tag,
        startTime: startTime,
        logFile: logFile,
        active: true,
        eventCount: 0,
        lastActivity: startTime,
      });

      log(`Started stalking user ${userInfo.tag} (${userId})`, "debug");
      return true;
    } catch (error) {
      log(`Error starting stalk for ${userId}: ${error.message}`, "error");
      return false;
    }
  }

  /**
   * Stop stalking a user
   * @param {string} userId - User ID to stop stalking
   * @returns {boolean} - Success status
   */
  stopStalking(userId) {
    try {
      if (!this.stalkedUsers.has(userId)) {
        return false; // Not stalking
      }

      const stalkInfo = this.stalkedUsers.get(userId);
      const endTime = new Date();
      const duration = endTime - stalkInfo.startTime;

      // Add end log entry
      const endLog = [
        "",
        "=".repeat(80),
        `STALK SESSION ENDED`,
        `User: ${stalkInfo.tag} (${userId})`,
        `Ended: ${endTime.toLocaleString()}`,
        `Duration: ${this.formatDuration(duration)}`,
        "=".repeat(80),
      ].join("\n");

      fs.appendFileSync(stalkInfo.logFile, endLog, "utf8");

      // Remove from memory
      this.stalkedUsers.delete(userId);

      log(`Stopped stalking user ${stalkInfo.tag} (${userId})`, "debug");
      return true;
    } catch (error) {
      log(`Error stopping stalk for ${userId}: ${error.message}`, "error");
      return false;
    }
  }

  /**
   * Log a message event
   * @param {string} userId - User ID
   * @param {string} eventType - Type of event (MESSAGE_SENT, MESSAGE_EDITED, MESSAGE_DELETED)
   * @param {Object} data - Event data
   */
  logMessageEvent(userId, eventType, data) {
    if (!this.stalkedUsers.has(userId)) return;

    try {
      const stalkInfo = this.stalkedUsers.get(userId);
      const timestamp = new Date().toLocaleString();

      let logEntry = `[${timestamp}] ${eventType}\n`;

      if (eventType === "MESSAGE_SENT") {
        logEntry += `  Server: ${data.guildName || "DM"}\n`;
        logEntry += `  Channel: #${data.channelName || "Direct Message"}\n`;
        logEntry += `  Content: ${data.content || "[No content]"}\n`;
        if (data.attachments && data.attachments.length > 0) {
          logEntry += `  Attachments: ${data.attachments.join(", ")}\n`;
        }
      } else if (eventType === "MESSAGE_EDITED") {
        logEntry += `  Server: ${data.guildName || "DM"}\n`;
        logEntry += `  Channel: #${data.channelName || "Direct Message"}\n`;
        logEntry += `  Old Content: ${data.oldContent || "[No content]"}\n`;
        logEntry += `  New Content: ${data.newContent || "[No content]"}\n`;
      } else if (eventType === "MESSAGE_DELETED") {
        logEntry += `  Server: ${data.guildName || "DM"}\n`;
        logEntry += `  Channel: #${data.channelName || "Direct Message"}\n`;
        logEntry += `  Content: ${data.content || "[No content]"}\n`;
      }

      logEntry += "\n";

      fs.appendFileSync(stalkInfo.logFile, logEntry, "utf8");
    } catch (error) {
      log(
        `Error logging message event for ${userId}: ${error.message}`,
        "error"
      );
    }
  }

  /**
   * Log a voice event
   * @param {string} userId - User ID
   * @param {string} eventType - Type of event (VOICE_JOIN, VOICE_LEAVE, VOICE_MOVE)
   * @param {Object} data - Event data
   */
  logVoiceEvent(userId, eventType, data) {
    if (!this.stalkedUsers.has(userId)) return;

    try {
      const stalkInfo = this.stalkedUsers.get(userId);
      const timestamp = new Date().toLocaleString();

      let logEntry = `[${timestamp}] ${eventType}\n`;
      logEntry += `  Server: ${data.guildName}\n`;

      if (eventType === "VOICE_JOIN") {
        logEntry += `  Joined: ${data.channelName}\n`;
      } else if (eventType === "VOICE_LEAVE") {
        logEntry += `  Left: ${data.channelName}\n`;
      } else if (eventType === "VOICE_MOVE") {
        logEntry += `  From: ${data.oldChannelName}\n`;
        logEntry += `  To: ${data.newChannelName}\n`;
      }

      logEntry += "\n";

      fs.appendFileSync(stalkInfo.logFile, logEntry, "utf8");
    } catch (error) {
      log(`Error logging voice event for ${userId}: ${error.message}`, "error");
    }
  }

  /**
   * Log a presence event
   * @param {string} userId - User ID
   * @param {string} eventType - Type of event (PRESENCE_UPDATE)
   * @param {Object} data - Event data
   */
  logPresenceEvent(userId, eventType, data) {
    if (!this.stalkedUsers.has(userId)) return;

    try {
      const stalkInfo = this.stalkedUsers.get(userId);
      const timestamp = new Date().toLocaleString();

      let logEntry = `[${timestamp}] ${eventType}\n`;

      if (data.status) {
        logEntry += `  Status: ${data.oldStatus || "Unknown"} → ${
          data.newStatus
        }\n`;
      }

      if (data.activities && data.activities.length > 0) {
        logEntry += `  Activities:\n`;
        for (const activity of data.activities) {
          logEntry += `    ${activity.type}: ${activity.name}\n`;
          if (activity.details)
            logEntry += `      Details: ${activity.details}\n`;
          if (activity.state) logEntry += `      State: ${activity.state}\n`;
        }
      } else {
        logEntry += `  Activities: None\n`;
      }

      logEntry += "\n";

      fs.appendFileSync(stalkInfo.logFile, logEntry, "utf8");
    } catch (error) {
      log(
        `Error logging presence event for ${userId}: ${error.message}`,
        "error"
      );
    }
  }

  /**
   * Get all stalked users
   * @returns {Map} - Map of stalked users
   */
  getStalkedUsers() {
    return this.stalkedUsers;
  }

  /**
   * Check if a user is being stalked
   * @param {string} userId - User ID
   * @returns {boolean} - Whether user is being stalked
   */
  isStalking(userId) {
    return this.stalkedUsers.has(userId);
  }

  /**
   * Get stalk info for a user
   * @param {string} userId - User ID
   * @returns {Object|null} - Stalk info or null
   */
  getStalkInfo(userId) {
    return this.stalkedUsers.get(userId) || null;
  }

  /**
   * Get all stalk files
   * @returns {Array} - Array of stalk file info
   */
  getAllStalkFiles() {
    try {
      const files = fs
        .readdirSync(this.stalkDir)
        .filter((file) => file.endsWith(".txt"));
      const stalkFiles = [];

      for (const file of files) {
        const userId = file.replace(".txt", "");
        const filePath = path.join(this.stalkDir, file);
        const stats = fs.statSync(filePath);

        // Read basic info from file
        const content = fs.readFileSync(filePath, "utf8");
        const lines = content.split("\n");
        const startLine = lines.find((line) =>
          line.includes("STALK SESSION STARTED")
        );
        const endLine = lines.find((line) =>
          line.includes("STALK SESSION ENDED")
        );

        let userTag = "Unknown";
        let startTime = stats.birthtime;

        if (startLine) {
          const userMatch = startLine.match(/User: (.+?) \((\d+)\)/);
          if (userMatch) {
            userTag = userMatch[1];
          }

          const timeMatch = lines.find((line) => line.includes("Started:"));
          if (timeMatch) {
            const timeStr = timeMatch.replace("Started: ", "").trim();
            startTime = new Date(timeStr);
          }
        }

        stalkFiles.push({
          userId: userId,
          userTag: userTag,
          filePath: filePath,
          fileSize: stats.size,
          startTime: startTime,
          isActive: this.stalkedUsers.has(userId),
          isEnded: !!endLine,
          lastModified: stats.mtime,
        });
      }

      return stalkFiles.sort((a, b) => b.lastModified - a.lastModified);
    } catch (error) {
      log(`Error getting stalk files: ${error.message}`, "error");
      return [];
    }
  }

  /**
   * Read stalk log content
   * @param {string} userId - User ID
   * @param {number} lines - Number of lines to read (0 for all)
   * @returns {string|null} - Log content or null
   */
  readStalkLog(userId, lines = 0) {
    try {
      const filePath = path.join(this.stalkDir, `${userId}.txt`);

      if (!fs.existsSync(filePath)) {
        return null;
      }

      const content = fs.readFileSync(filePath, "utf8");

      if (lines === 0) {
        return content;
      }

      const allLines = content.split("\n");
      const selectedLines = allLines.slice(-lines);
      return selectedLines.join("\n");
    } catch (error) {
      log(`Error reading stalk log for ${userId}: ${error.message}`, "error");
      return null;
    }
  }

  /**
   * Format duration in human readable format
   * @param {number} ms - Duration in milliseconds
   * @returns {string} - Formatted duration
   */
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Get statistics for a stalk session
   * @param {string} userId - User ID
   * @returns {Object} - Statistics object
   */
  getStalkStats(userId) {
    try {
      const content = this.readStalkLog(userId);
      if (!content) return null;

      const lines = content.split("\n");
      const stats = {
        messagesSent: 0,
        messagesEdited: 0,
        messagesDeleted: 0,
        voiceJoins: 0,
        voiceLeaves: 0,
        presenceUpdates: 0,
        totalEvents: 0,
      };

      for (const line of lines) {
        if (line.includes("MESSAGE_SENT")) stats.messagesSent++;
        else if (line.includes("MESSAGE_EDITED")) stats.messagesEdited++;
        else if (line.includes("MESSAGE_DELETED")) stats.messagesDeleted++;
        else if (line.includes("VOICE_JOIN")) stats.voiceJoins++;
        else if (line.includes("VOICE_LEAVE")) stats.voiceLeaves++;
        else if (line.includes("PRESENCE_UPDATE")) stats.presenceUpdates++;
      }

      stats.totalEvents =
        stats.messagesSent +
        stats.messagesEdited +
        stats.messagesDeleted +
        stats.voiceJoins +
        stats.voiceLeaves +
        stats.presenceUpdates;

      return stats;
    } catch (error) {
      log(`Error getting stalk stats for ${userId}: ${error.message}`, "error");
      return null;
    }
  }

  /**
   * Generate a unique session ID
   * @returns {string} - Session ID
   */
  generateSessionId() {
    return `stalk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sanitize content for logging (remove sensitive information)
   * @param {string} content - Content to sanitize
   * @returns {string} - Sanitized content
   */
  sanitizeContent(content) {
    if (!content || typeof content !== "string") return content;

    // Remove potential tokens or sensitive data
    return content
      .replace(
        /[A-Za-z0-9_-]{23}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27}/g,
        "[TOKEN_REDACTED]"
      )
      .replace(/mfa\.[A-Za-z0-9_-]{84}/g, "[MFA_TOKEN_REDACTED]")
      .replace(
        /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
        "[CARD_NUMBER_REDACTED]"
      )
      .replace(
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        "[EMAIL_REDACTED]"
      );
  }

  /**
   * Get active stalk sessions count
   * @returns {number} - Number of active sessions
   */
  getActiveSessionsCount() {
    return this.stalkedUsers.size;
  }

  /**
   * Get total events logged for a user
   * @param {string} userId - User ID
   * @returns {number} - Total events count
   */
  getTotalEventsCount(userId) {
    if (!this.stalkedUsers.has(userId)) return 0;
    return this.stalkedUsers.get(userId).eventCount || 0;
  }

  /**
   * Check if stalk session is active and recent
   * @param {string} userId - User ID
   * @returns {boolean} - Whether session is active and recent
   */
  isSessionHealthy(userId) {
    if (!this.stalkedUsers.has(userId)) return false;

    const stalkInfo = this.stalkedUsers.get(userId);
    const now = new Date();
    const timeSinceLastActivity =
      now - (stalkInfo.lastActivity || stalkInfo.startTime);

    // Consider session healthy if there was activity in the last 24 hours
    return timeSinceLastActivity < 24 * 60 * 60 * 1000;
  }
}

export default new StalkManager();
