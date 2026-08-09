/**
 * COMMAND HANDLER
 *
 * This module handles the loading, registration, and execution of all bot commands.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { log, parseArgs, formatTime, loadAllowedUsers } from "../utils/functions.js";

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
        const command = await import(`file://${filePath}`);
        if (!command.default || !command.default.name || !command.default.execute) continue;

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

      const hasPrefix = message.content.startsWith(client.prefix);
      if (!client.noprefix && !hasPrefix) return;


      const allowedUsers = loadAllowedUsers();
      if (message.author.id !== client.user.id && !allowedUsers.includes(message.author.id)) return;

      let content = hasPrefix ? message.content.slice(client.prefix.length).trim() : message.content.trim();
      const args = parseArgs(content);
      if (args.length === 0) return;
      
      const commandName = args.shift().toLowerCase();
      const command = client.commands.get(commandName) || [...client.commands.values()].find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

      if (!command) return;

    
      if (command.ownerOnly && message.author.id !== client.user.id) return;

      if (!client.cooldowns.has(command.name)) client.cooldowns.set(command.name, new Map());
      const now = Date.now();
      const timestamps = client.cooldowns.get(command.name);
      const cooldownAmount = (command.cooldown || 3) * 1000;

      if (timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
        if (now < expirationTime) return;
      }

      timestamps.set(message.author.id, now);
      setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

      try {
        const { canExecuteCommand } = await import("../utils/commandHandler.js");
        const { canExecute, reason } = canExecuteCommand(command, message, client);
        if (!canExecute) return message.channel.send(`> ❌ **Error:** ${reason}`);

        if (command.category === "nsfw") {
          const { loadConfig } = await import("../utils/functions.js");
          const config = loadConfig();
          if (!config.nsfw || config.nsfw.enabled === false) return message.channel.send("> ❌ **NSFW commands are disabled.**");
        }

        await command.execute(client, message, args);
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

function getCommandFiles(directory, files = []) {
  const items = fs.readdirSync(directory, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(directory, item.name);
    if (item.isDirectory()) getCommandFiles(fullPath, files);
    else if (item.name.endsWith(".js")) files.push(fullPath);
  }
  return files;
}
