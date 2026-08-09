/**
 * UTILITY FUNCTIONS MODULE
 *
 * This module provides essential utility functions used throughout the selfbot:
 * - Configuration management with caching
 * - Logging system with file output and colored console
 * - Time and date formatting utilities
 * - String manipulation and validation helpers
 * - File system utilities for data management
 *
 * All functions are designed to be reusable and handle errors gracefully.
 *
 * @module utils/functions
 * @author lilbarro
 */

// Import required Node.js modules
import { setTimeout as sleep } from "timers/promises"; // Promise-based setTimeout
import chalk from "chalk"; // Terminal string styling
import fs from "fs"; // File system operations
import yaml from "js-yaml"; // YAML parsing and stringifying
import path from "path"; // Path manipulation utilities
import { fileURLToPath } from "url"; // URL to file path conversion

// Get current file path and directory (ES modules compatibility)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define important directory paths for data storage
const DATA_DIR = path.join(__dirname, "..", "data"); // Main data directory
const ERRORS_FILE = path.join(DATA_DIR, "errors.txt"); // Error log file
const RELATIONSHIP_DIR = path.join(DATA_DIR, "relationship"); // Relationship logs directory
const ALLOWED_FILE = path.join(DATA_DIR, "allowed.json"); // Allowed users file

// Initialize data directories on module load
// This ensures all required directories exist before any operations
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log("Created data directory:", DATA_DIR);
}

if (!fs.existsSync(RELATIONSHIP_DIR)) {
  fs.mkdirSync(RELATIONSHIP_DIR, { recursive: true });
  console.log("Created relationship directory:", RELATIONSHIP_DIR);
}

if (!fs.existsSync(ALLOWED_FILE)) {
  fs.writeFileSync(ALLOWED_FILE, JSON.stringify([], null, 2));
}

// Clear the errors file on startup to start with a clean slate
try {
  fs.writeFileSync(ERRORS_FILE, "");
} catch (error) {
  console.error(`Failed to clear errors file: ${error.message}`);
}

// Configuration cache to avoid repeated file reads
// This improves performance by caching the config in memory
let configCache = null;

/**
 * Load and validate configuration from config.yaml file
 */
export function loadConfig(forceReload = false) {
  if (configCache && !forceReload) {
    return configCache;
  }

  try {
    const configPath = path.join(__dirname, "..", "config.yaml");
    if (!fs.existsSync(configPath)) {
      throw new Error(`Configuration file not found at: ${configPath}`);
    }

    const configFile = fs.readFileSync(configPath, "utf8");
    configCache = yaml.load(configFile);

    if (!configCache || typeof configCache !== "object") {
      throw new Error("Invalid configuration: File is empty or not a valid YAML object");
    }

    if (!configCache.selfbot) {
      throw new Error('Invalid configuration: Missing "selfbot" section');
    }

    return configCache;
  } catch (error) {
    console.error(chalk.red("[CONFIG] Error loading configuration:"), error.message);
    process.exit(1);
  }
}


export function loadAllowedUsers() {
  try {
    if (!fs.existsSync(ALLOWED_FILE)) return [];
    const data = fs.readFileSync(ALLOWED_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    logError(error, "Failed to load allowed users");
    return [];
  }
}


export function saveAllowedUsers(users) {
  try {
    fs.writeFileSync(ALLOWED_FILE, JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    logError(error, "Failed to save allowed users");
    return false;
  }
}

/**
 * Clear the console screen in a cross-platform way
 */
export function clearConsole() {
  try {
    const isWin = process.platform === "win32";
    if (isWin) {
      process.stdout.write("\x1Bc");
    } else {
      process.stdout.write("\x1B[2J\x1B[3J\x1B[H");
    }
    if (typeof console.clear === "function") {
      console.clear();
    }
  } catch (error) {
    console.log("\n".repeat(process.stdout.rows || 40));
  }
}

/**
 * Format milliseconds into a readable time string
 */
export function formatTime(ms) {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours % 24 > 0) parts.push(`${hours % 24}h`);
  if (minutes % 60 > 0) parts.push(`${minutes % 60}m`);
  if (seconds % 60 > 0) parts.push(`${seconds % 60}s`);
  return parts.join(" ");
}

/**
 * Create a formatted code block message
 */
export function codeBlock(content, language = "") {
  return `\`\`\`${language}\n${content}\n\`\`\``;
}

/**
 * Create a formatted ANSI code block
 */
export function ansiBlock(lines) {
  return ["``ansi", ...lines, "```"].join("\n");
}

/**
 * Safely truncate a string to a maximum length
 */
export function truncate(str, maxLength = 2000) {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + "...";
}

/**
 * Log a message with timestamp
 */
export function log(message, type = "info") {
  const timestamp = new Date().toLocaleTimeString();
  const prefix =
    {
      info: chalk.blue("[INFO]"),
      warn: chalk.yellow("[WARN]"),
      error: chalk.red("[ERROR]"),
      success: chalk.green("[SUCCESS]"),
      debug: chalk.magenta("[DEBUG]"),
    }[type] || chalk.blue("[INFO]");

  if (type === "error") {
    logError(message);
    return;
  }

  if (type === "debug") {
    const config = loadConfig();
    if (!config.debug_mode || !config.debug_mode.enabled) return;
    try {
      const debugDir = path.join(DATA_DIR, "debug");
      if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
      const debugFile = path.join(debugDir, `${getFormattedDate()}.log`);
      const logEntry = `${new Date().toISOString()} [DEBUG] ${message}\n`;
      fs.appendFileSync(debugFile, logEntry);
    } catch (e) {}
  }

  console.log(`${chalk.gray(timestamp)} ${prefix} ${message}`);
}

/**
 * Log an error to the errors.txt file
 */
export function logError(error, context = "") {
  try {
    const timestamp = new Date().toISOString();
    let errorMessage = "";
    if (error instanceof Error) {
      errorMessage = `${timestamp} [ERROR] ${context ? context + ": " : ""}${error.message}\n${error.stack}\n\n`;
    } else {
      errorMessage = `${timestamp} [ERROR] ${context ? context + ": " : ""}${error}\n\n`;
    }
    fs.appendFileSync(ERRORS_FILE, errorMessage);
  } catch (e) {
    console.error(chalk.red("[ERROR]"), "Failed to log error to file:", e.message);
  }
}

/**
 * Wait for a specified amount of time
 */
export async function wait(ms) {
  return sleep(ms);
}

/**
 * Check if a string is a valid URL
 */
export function isValidUrl(str) {
  try {
    new URL(str);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Parse arguments from a command string
 */
export function parseArgs(content) {
  const args = [];
  let current = "";
  let inQuotes = false;
  let escapeNext = false;
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (escapeNext) {
      current += char;
      escapeNext = false;
      continue;
    }
    if (char === "\\") {
      escapeNext = true;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === " " && !inQuotes) {
      if (current) {
        args.push(current);
        current = "";
      }
      continue;
    }
    current += char;
  }
  if (current) args.push(current);
  return args;
}

/**
 * Get the current date formatted as YYYY-MM-DD
 */
export function getFormattedDate() {
  const date = new Date();
  return date.toISOString().split("T")[0];
}

/**
 * Format a string to be Discord-friendly
 */
export function formatDiscordName(str) {
  if (!str) return "unnamed";
  let formatted = str.toLowerCase();
  formatted = formatted.replace(/\s+/g, "-");
  formatted = formatted.replace(/[^a-z0-9-_]/g, "");
  if (!formatted) return "unnamed";
  if (formatted.length > 100) formatted = formatted.substring(0, 100);
  return formatted;
}

/**
 * Parse time strings like \"5m\", \"1h\", etc.
 */
export function parseTime(duration) {
  const timeRegex = /^(\d+)([smhd])$/;
  const match = duration.match(timeRegex);
  if (!match) return null;
  const [, value, unit] = match;
  const multiplier = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  }[unit];
  return parseInt(value, 10) * multiplier;
}

/**
 * Convert string permission names to Discord.js permission constants
 */
export function convertPermission(permission) {
    const permissionMap = {
        'SendMessages': 'SEND_MESSAGES',
        'AttachFiles': 'ATTACH_FILES',
        'AddReactions': 'ADD_REACTIONS',
        'ManageMessages': 'MANAGE_MESSAGES',
        'ManageChannels': 'MANAGE_CHANNELS',
        'KickMembers': 'KICK_MEMBERS',
        'BanMembers': 'BAN_MEMBERS',
        'ManageRoles': 'MANAGE_ROLES',
        'Administrator': 'ADMINISTRATOR',
        'ViewChannel': 'VIEW_CHANNEL',
        'ReadMessageHistory': 'READ_MESSAGE_HISTORY',
        'UseExternalEmojis': 'USE_EXTERNAL_EMOJIS',
        'ManageWebhooks': 'MANAGE_WEBHOOKS',
        'ManageGuild': 'MANAGE_GUILD',
        'CreateInstantInvite': 'CREATE_INSTANT_INVITE',
        'ChangeNickname': 'CHANGE_NICKNAME',
        'ManageNicknames': 'MANAGE_NICKNAMES',
        'PrioritySpeaker': 'PRIORITY_SPEAKER',
        'Stream': 'STREAM',
        'Connect': 'CONNECT',
        'Speak': 'SPEAK',
        'MuteMembers': 'MUTE_MEMBERS',
        'DeafenMembers': 'DEAFEN_MEMBERS',
        'MoveMembers': 'MOVE_MEMBERS',
        'UseVAD': 'USE_VAD'
    };
    return permissionMap[permission] || permission.toUpperCase().replace(/ /g, '_');
}

/**
 * Check if a member has specific permissions
 */
export function hasPermissions(member, permissions) {
    if (!Array.isArray(permissions)) permissions = [permissions];
    for (const permission of permissions) {
        const permissionString = convertPermission(permission);
        if (!member.permissions.has(permissionString)) return false;
    }
    return true;
}
