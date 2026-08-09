/**
 * READY EVENT HANDLER
 */

import chalk from "chalk";
import { log } from "../utils/functions.js";
import RpcManager from "../utils/RpcManager.js";
import { RichPresence } from "discord.js-selfbot-v13";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  name: "ready",
  once: true,

  execute: async (client) => {
    console.log(chalk.cyan("─".repeat(50)));

    log(`Logged in as ${chalk.cyan(client.user.tag)}`, "success");
    log(`User ID: ${chalk.cyan(client.user.id)}`, "info");
    log(`Prefix: ${chalk.cyan(client.prefix)}`, "info");
    log(`Status: ${chalk.cyan(client.config.selfbot.status)}`, "info");

    console.log("");
    log(
      `Use ${chalk.cyan(`${client.prefix}help`)} to get info about available commands`,
      "info"
    );

    console.log("");
    log("System Information:", "info");
    console.log(
      `  ${chalk.yellow("•")} ${chalk.yellow("Node.js")}: ${chalk.green(process.version)}`
    );
    console.log(
      `  ${chalk.yellow("•")} ${chalk.yellow("Platform")}: ${chalk.green(process.platform)}`
    );

    console.log(chalk.cyan("─".repeat(50)));

    // Set status with delay
    setTimeout(async () => {
      await client.user.setStatus(client.config.selfbot.status || 'dnd');
    }, 3000);

    // Initialize Rich Presence
    log("Initializing Rich Presence system...", "info");

    try {
      const rpcConfig = await RpcManager.loadConfig();

      if (rpcConfig && rpcConfig.rpc && rpcConfig.rpc.enabled) {
        const success = await RpcManager.updatePresence(client);
        if (success) {
          log("Rich Presence initialized successfully", "success");
        } else {
          log("Failed to initialize Rich Presence", "warn");
        }
      } else {
        log("Rich Presence is disabled in configuration", "info");
        client.user.setActivity(null);
      }

      client.rpcManager = RpcManager;

      if (client.config.debug_mode && client.config.debug_mode.enabled) {
        const currentConfig = RpcManager.getCurrentConfig();
        if (currentConfig && currentConfig.rpc && currentConfig.rpc.default && currentConfig.rpc.default.assets) {
          const assets = currentConfig.rpc.default.assets;
          log(`RPC Assets configured - Large: ${assets.large_image || 'none'}, Small: ${assets.small_image || 'none'}`, 'debug');
        }
      }

    } catch (error) {
      log(`Error during RPC initialization: ${error.message}`, "error");
      client.user.setActivity(null);
    }

    log("Bot status set and RPC system ready.", "info");

    // Debug relationship information
    if (client.config.debug_mode && client.config.debug_mode.enabled) {
      log("Relationship Manager Information:", "debug");

      if (client.relationships) {
        const friends = client.relationships.cache.filter((r) => r.type === "FRIEND").size;
        const blocked = client.relationships.cache.filter((r) => r.type === "BLOCKED").size;
        const incoming = client.relationships.cache.filter((r) => r.type === "INCOMING_REQUEST").size;
        const outgoing = client.relationships.cache.filter((r) => r.type === "OUTGOING_REQUEST").size;

        log(`Friends: ${chalk.green(friends)}`, "debug");
        log(`Blocked: ${chalk.red(blocked)}`, "debug");
        log(`Incoming Requests: ${chalk.yellow(incoming)}`, "debug");
        log(`Outgoing Requests: ${chalk.yellow(outgoing)}`, "debug");

        client.on("relationshipAdd", (relationship) => {
          if (client.config.debug_mode.enabled) {
            const relationshipType = typeof relationship === "string" ? "unknown" : relationship.type;
            const userId = typeof relationship === "string" ? relationship : relationship.id;
            log(`[DEBUG] relationshipAdd event fired: ${relationshipType} - ${userId}`, "debug");
          }
        });

        client.on("relationshipRemove", (relationship) => {
          if (client.config.debug_mode.enabled) {
            const relationshipType = typeof relationship === "string" ? "unknown" : relationship.type;
            const userId = typeof relationship === "string" ? relationship : relationship.id;
            log(`[DEBUG] relationshipRemove event fired: ${relationshipType} - ${userId}`, "debug");
          }
        });

        client.on("presenceUpdate", (oldPresence, newPresence) => {
          if (client.config.debug_mode.enabled && newPresence.user) {
            const isFriend =
              client.relationships.cache.has(newPresence.user.id) &&
              client.relationships.cache.get(newPresence.user.id).type === "FRIEND";
            if (isFriend) {
              log(`[DEBUG] presenceUpdate event fired for friend: ${newPresence.user.tag}`, "debug");
            }
          }
        });

        client.on("userUpdate", (oldUser, newUser) => {
          if (client.config.debug_mode.enabled) {
            const isFriend =
              client.relationships.cache.has(newUser.id) &&
              client.relationships.cache.get(newUser.id).type === "FRIEND";
            if (isFriend) {
              log(`[DEBUG] userUpdate event fired for friend: ${newUser.tag}`, "debug");
            }
          }
        });

      } else {
        log("Relationship manager is not available!", "warn");
      }
    }

    // ✅ AI Reply handler
    try {
      const { handleAIReply } = await import('../utils/aiReplyHandler.js');
      client.on('messageCreate', (message) => handleAIReply(client, message));
      log('AI Reply handler initialized', 'info');
    } catch (err) {
      log('Failed to initialize AI Reply handler: ' + err.message, 'warn');
    }

    // ✅ AI AFK handler
    try {
      const { handleAiAfkMessage } = await import('../utils/aiAfkHandler.js');
      client.on('messageCreate', (message) => handleAiAfkMessage(client, message));
      log('AI AFK handler initialized', 'info');
    } catch (err) {
      log('Failed to initialize AI AFK handler: ' + err.message, 'warn');
    }

    log(`Barro is ready with ${client.commands.size} commands`, "success");
  },
};