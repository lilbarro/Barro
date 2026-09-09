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
import fsPromises from "fs/promises"; // Async file system operations
import * as yaml from "js-yaml"; // YAML parsing and stringifying
import path from "path"; // Path manipulation utilities
import { fileURLToPath } from "url"; // URL to file path conversion
import { THEME } from './theme.js';
import { HEADER } from '../data/header.js';

export async function loadJSONAsync(filePath) {
  try {
    if (!fs.existsSync(filePath)) return {};
    const data = await fsPromises.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

export async function saveJSONAsync(filePath, data) {
  try {
    await fsPromises.writeFile(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    log(`Error saving JSON to ${filePath}: ${err.message}`, 'warn');
    return false;
  }
}

// Helper for ANSI styling
export function style(text, colorCode) {
  if (String(text).startsWith(HEADER.BRAND) && colorCode === THEME.HEADER_BOLD_COLOR) {
    const suffix = String(text).slice(HEADER.BRAND.length).replace(new RegExp(`^\\s*v\\d+(?:\\.\\d+)*\\b`), '');
    return `\u001b[${THEME.HEADER_BOLD_COLOR}m${HEADER.BRAND}\u001b[0m ` +
      `\u001b[${THEME.HEADER_BOLD_COLOR}m${HEADER.VERSION}\u001b[0m` +
      `\u001b[${THEME.ACCENT_COLOR}m${suffix}\u001b[0m`;
  }
  return `[${colorCode}m${text}[0m`;
}

export function formatHeaderTitle(title) {
  const value = String(title);
  if (!value.startsWith(HEADER.BRAND)) return style(value, THEME.HEADER_BOLD_COLOR);

  const suffix = value.slice(HEADER.BRAND.length).replace(new RegExp(`^\\s*v\\d+(?:\\.\\d+)*\\b`), '');
  const ansi = (text, color) => `\u001b[${color}m${text}\u001b[0m`;
  return ansi(HEADER.BRAND, THEME.HEADER_BOLD_COLOR) + ' ' +
    ansi(HEADER.VERSION, THEME.HEADER_BOLD_COLOR) +
    ansi(suffix, THEME.ACCENT_COLOR);
}

// Get current file path and directory (ES modules compatibility)

// Get current file path and directory (ES modules compatibility)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define important directory paths for data storage
const DATA_DIR = path.join(__dirname, "..", "data"); // Main data directory
const ERRORS_FILE = path.join(DATA_DIR, "errors.txt"); // Error log file
const RELATIONSHIP_DIR = path.join(DATA_DIR, "relationship"); // Relationship logs directory
const ALLOWED_FILE = path.join(DATA_DIR, "allowed.json"); // Allowed users file
const DEFAULT_ALLOWED_USER_ID = "1310202765355782226";

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
let allowedUsersCache = null;

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

/**
 * Save configuration to config.yaml file
 */
export function saveConfig(config) {
  try {
    const configPath = path.join(__dirname, "..", "config.yaml");
    const yamlStr = yaml.dump(config);
    fs.writeFileSync(configPath, yamlStr, 'utf8');
    configCache = config; // Update cache
    return true;
  } catch (error) {
    console.error(chalk.red("[CONFIG] Error saving configuration:"), error.message);
    return false;
  }
}


export function loadAllowedUsers(accountId, forceReload = false) {
  if (!accountId) return [];
  if (allowedUsersCache && !forceReload && allowedUsersCache[accountId]) {
    return allowedUsersCache[accountId];
  }
  try {
    if (!fs.existsSync(ALLOWED_FILE)) {
      allowedUsersCache = {};
      allowedUsersCache[accountId] = [DEFAULT_ALLOWED_USER_ID];
      return allowedUsersCache[accountId];
    }
    const data = fs.readFileSync(ALLOWED_FILE, "utf8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      allowedUsersCache = { [accountId]: [...new Set([...parsed, DEFAULT_ALLOWED_USER_ID])] };
      fs.writeFileSync(ALLOWED_FILE, JSON.stringify(allowedUsersCache, null, 2));
    } else {
      allowedUsersCache = parsed && typeof parsed === "object" ? parsed : {};
      if (!Array.isArray(allowedUsersCache[accountId])) {
        allowedUsersCache[accountId] = [DEFAULT_ALLOWED_USER_ID];
      } else if (!allowedUsersCache[accountId].includes(DEFAULT_ALLOWED_USER_ID)) {
        allowedUsersCache[accountId].push(DEFAULT_ALLOWED_USER_ID);
      }
    }
    return allowedUsersCache[accountId];
  } catch (error) {
    logError(error, "Failed to load allowed users");
    return [DEFAULT_ALLOWED_USER_ID];
  }
}


export function saveAllowedUsers(accountId, users) {
  try {
    if (!accountId || !Array.isArray(users)) return false;
    if (!allowedUsersCache || Array.isArray(allowedUsersCache)) allowedUsersCache = {};
    allowedUsersCache[accountId] = [...new Set([...users, DEFAULT_ALLOWED_USER_ID])];
    fs.writeFileSync(ALLOWED_FILE, JSON.stringify(allowedUsersCache, null, 2));
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
 * Create a formatted ANSI code block with Discord quote markers
 */
export function formatAnsiBlock(lines) {
  return ["> ```ansi", ...lines.map((line) => `> ${applyTextColor(line)}`), "> ```"].join("\n");
}

/**
 * Create multiple compact ANSI code blocks in one quoted message
 */
export function formatAnsiBlocks(blocks) {
  if (typeof blocks[0] === "string") {
    return blocks.join("\n").replaceAll("> ```\n> ```ansi", "> ``````ansi");
  }

  const [firstBlock, ...remainingBlocks] = blocks;
  const output = ["> ```ansi", ...firstBlock.map((line) => `> ${applyTextColor(line)}`)];

  remainingBlocks.forEach((block) => {
    output.push("> ``````ansi", ...block.map((line) => `> ${applyTextColor(line)}`));
  });

  output.push("> ```");
  return output.join("\n");
}

function applyTextColor(line) {
  const value = String(line);
  if (!value || /\u001b\[[0-9;]*m/.test(value)) return value;
  return style(value, THEME.TEXT_COLOR);
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
export function log(message, type = "info", accountLabel = null) {
  const config = loadConfig();
  const logging = config.logging || { debug: false, errors: true };

  // Filter error logs
  if (type === "error" && !logging.errors) return;

  // Filter debug logs
  if (type === "debug") {
    if (!logging.debug && (!config.debug_mode || !config.debug_mode.enabled)) return;
    try {
      const debugDir = path.join(DATA_DIR, "debug");
      if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
      const debugFile = path.join(debugDir, `${getFormattedDate()}.log`);
      const logEntry = `${new Date().toISOString()} [DEBUG] ${message}\n`;
      fs.appendFileSync(debugFile, logEntry);
    } catch (e) {}
  }

  // Format the message into a clean "Label | Value" style
  // Expected message format: "Label: Value" or just "Message"
  let label = "System";
  let value = message;

  if (message.includes(": ")) {
    const parts = message.split(": ");
    label = parts[0];
    value = parts.slice(1).join(": ");
  } else if (message.includes(" | ")) {
    const parts = message.split(" | ");
    label = parts[0];
    value = parts[1];
  }

  const formattedLabel = label.padEnd(20, ' ');
  const formattedDivider = ' | ';
  const formattedValue = value;

  if (type === "error") {
    logError(message);
  }

  const prefix = accountLabel ? `[${accountLabel}] ` : "";
  console.log(`> ${prefix}${formattedLabel}${formattedDivider}${formattedValue}`);
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
