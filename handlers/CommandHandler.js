/**
 * COMMAND HANDLER
 *
 * This module handles the loading, registration, and execution of all bot commands.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { log, parseArgs, formatTime, loadAllowedUsers, loadConfig } from "../utils/functions.js";
import { getUserPrefix } from "../utils/userPrefixManager.js";
import { AUTO_DELETE } from "../utils/autoDelete.js";
import { activateTheme } from "../utils/theme.js";

// Get current file path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load and register all commands from the commands directory
 */
export async function loadCommands(client) {
  try {
    if (!client.commands) client.commands = new Map();
    const commandsDir = path.join(__dirname, "..", "commands");
    const commandFiles = getCommandFiles(commandsDir);

    log(`Loading ${commandFiles.length} commands...`, "info");

    let loadedCount = 0;
    const categories = new Map();

    for (const filePath of commandFiles) {
      try {
        const normalizedPath = filePath.replace(/\\/g, "/");
        if (normalizedPath.includes("/commands/_backups/")) {
          continue;
        }
        const legacyTrackingCommands = [
          "/commands/main/shadow.js",
          "/commands/main/expose.js",
          "/commands/AI/dossier.js"
        ];
        if (legacyTrackingCommands.some(legacyPath => normalizedPath.endsWith(legacyPath))) {
          continue;
        }

        const command = await import(`file://${filePath}`);
        console.log(`[DEBUG] Attempting to load command: ${path.basename(filePath)}`);
        if (!command.default || !command.default.name || !command.default.execute) {
            console.log(`[DEBUG] Command ${path.basename(filePath)} missing default, name, or execute`);
            continue;
        }

        const pathParts = filePath.split(path.sep);
        const categoryIndex = pathParts.indexOf("commands") + 1;
        const category = pathParts[categoryIndex] || "general";

        command.default.category = category;
        client.commands.set(command.default.name, command.default);

        if (!categories.has(category)) categories.set(category, 0);
        categories.set(category, categories.get(category) + 1);

        loadedCount++;
      } catch (error) {
        log(`Error loading command file ${path.basename(filePath)}: ${error.message}`, "error");
      }
    }

    log(`Successfully loaded ${loadedCount} commands in ${categories.size} categories`, "success");

    client.on("messageCreate", async (message) => {
      if (message.author.bot) return;

      const messagePrefix = getUserPrefix(client.user?.id, client.prefix);
      const hasPrefix = message.content.startsWith(messagePrefix);
      if (!client.noprefix && !hasPrefix) return;

      const allowedUsers = loadAllowedUsers(client.user?.id);
      const config = loadConfig();
      const superAdmins = config.owners || [];
      const isOwner = message.author.id === client.user.id;
      const isAllowed = isOwner || superAdmins.includes(message.author.id) || allowedUsers.includes(message.author.id);

      if (!isAllowed) return;

      let content = hasPrefix ? message.content.slice(messagePrefix.length).trim() : message.content.trim();
      const args = parseArgs(content);
      if (args.length === 0) return;

      const commandName = args.shift().toLowerCase();
      const command = client.commands.get(commandName) || [...client.commands.values()].find(cmd =>
        cmd.name?.toLowerCase() === commandName || (cmd.aliases && cmd.aliases.includes(commandName))
      );

      if (!command) return;

      if (command.ownerOnly && message.author.id !== client.user.id) {
        if (!superAdmins.includes(message.author.id)) return;
      }

      if (!client.cooldowns.has(command.name)) client.cooldowns.set(command.name, new Map());
      const now = Date.now();
      const timestamps = client.cooldowns.get(command.name);
        const isHelpRequest = ['help', '--help', '-h'].includes(args[0]?.toLowerCase());
      // Half the cooldown of every command. Defaults to 5s if no cooldown is specified.
      const cooldownAmount = Math.max((command.cooldown || 10) / 2, 2.5) * 1000;

        if (!isHelpRequest && timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
        if (now < expirationTime) return;
      }

        if (!isHelpRequest) {
          timestamps.set(message.author.id, now);
          setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
        }

      const messageLifetime = getCommandMessageLifetime(command, args, isHelpRequest);
      const commandMessage = createAutoDeleteMessage(message, messageLifetime);
      scheduleMessageDeletion(message, AUTO_DELETE.INVOKING_MESSAGE_MS);
      activateTheme(client.user?.id);

      try {
        const { canExecuteCommand } = await import("../utils/commandHandler.js");
        const { canExecute, reason } = canExecuteCommand(command, commandMessage, client);
        if (!canExecute) return commandMessage.channel.send(`> ❌ **Error:** ${reason}`);

        if (command.category === "nsfw") {
          if (!config.nsfw || config.nsfw.enabled === false) return commandMessage.channel.send("> ❌ **NSFW commands are disabled.**");
        }

        await command.execute(client, commandMessage, args);
      } catch (error) {
        log(`Error executing ${command.name}: ${error.message}`, "error");
      }
    });

    return loadedCount;
  } catch (error) {
    log(`Error loading commands: ${error.message}`, "error");
    return 0;
  }
}

function getCommandMessageLifetime(command, args, isHelpRequest) {
  const menuCommands = new Set([
    'aiask', 'aiafk', 'aireply', 'aidoom', 'dossier', 'help', 'savepresence', 'todo',
    'expose', 'gcname', 'ragebait', 'shadow', 'noprefix', 'view', 'rpc',
    'statusrotator', 'badreply', 'stalk', 'viewstalk', 'unwhitelist', 'whitelist',
    'quest', 'accent', 'header', 'normalheader', 'label', 'divider', 'text'
  ]);

  if (isHelpRequest || command.name.toLowerCase() === 'help' || (args.length === 0 && menuCommands.has(command.name.toLowerCase()))) {
    return AUTO_DELETE.HELP_MENU_MS;
  }

  const shortLivedCommands = new Set([
    'afk', 'aiafk', 'aireply', 'aidoom', 'backup', 'prefix', 'reload',
    'revoke', 'selfinfo', 'support', 'taskstop', 'status', 'spoof'
  ]);

  if (args.length > 0 || shortLivedCommands.has(command.name.toLowerCase())) return AUTO_DELETE.SUBCOMMAND_MS;
  return AUTO_DELETE.NORMAL_COMMAND_MS;
}

function createAutoDeleteMessage(message, lifetime) {
  const wrappedChannel = new Proxy(message.channel, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (property !== 'send' || typeof value !== 'function') return value;

      return (...args) => scheduleMessageDeletion(
        Reflect.apply(value, target, args),
        lifetime
      );
    }
  });

  return new Proxy(message, {
    get(target, property, receiver) {
      if (property === 'channel') return wrappedChannel;
      if (property !== 'reply') return Reflect.get(target, property, receiver);

      return (...args) => scheduleMessageDeletion(
        Reflect.apply(target.reply, target, args),
        lifetime
      );
    }
  });
}

function scheduleMessageDeletion(result, lifetime) {
  return Promise.resolve(result).then((sentMessage) => {
    if (sentMessage && typeof sentMessage.delete === 'function') {
      setTimeout(() => {
        try {
          Promise.resolve(sentMessage.delete()).catch(() => {});
        } catch {}
      }, lifetime);
    }
    return sentMessage;
  });
}

function getCommandFiles(directory, files = []) {
  const items = fs.readdirSync(directory, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(directory, item.name);
    if (item.isDirectory()) getCommandFiles(fullPath, files);
    else if (item.name.endsWith(".js")) files.push(fullPath);
  }
  return files;
}
