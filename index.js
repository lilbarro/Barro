import { Client } from "discord.js-selfbot-v13";
import chalk from "chalk";
import figlet from "figlet";
import gradient from "gradient-string";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

import { loadEvents } from "./handlers/EventsHandler.js";
import { loadCommands } from "./handlers/CommandHandler.js";
import { setupAntiCrash } from "./handlers/anticrash.js";
import { setupRateLimit } from "./handlers/RateLimitHandler.js";
import { loadConfig, clearConsole, log, wait } from "./utils/functions.js";
import TaskManager from "./utils/TaskManager.js";
import { initNitroSniper } from "./commands/general/nitrosniper.js";

let isShuttingDown = false;
let client = null;

// ============================================
// TRACKING HELPER FUNCTIONS
// ============================================

function loadJSON(path) {
  try {
    if (!existsSync(path)) return {};
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return {};
  }
}

function saveJSON(path, data) {
  try {
    writeFileSync(path, JSON.stringify(data, null, 2));
  } catch (err) {
    log(`Error saving JSON to ${path}: ${err.message}`, 'warn');
  }
}

function setupTracking(client) {
  const PFP_PATH = resolve('./data/pfphistory.json');
  const NAME_PATH = resolve('./data/namehistory.json');
  const BANNER_PATH = resolve('./data/bannerhistory.json');

  client.on('userUpdate', async (oldUser, newUser) => {
    try {
      // Fetch full profile to get banner
      let fullOldUser = oldUser;
      let fullNewUser = newUser;

      try {
        fullNewUser = await client.users.fetch(newUser.id, { force: true });
      } catch {
        // Keep original if fetch fails
      }

      // ---- TRACK PFP CHANGE ----
      if (oldUser.avatar !== newUser.avatar) {
        const pfpData = loadJSON(PFP_PATH);
        if (!pfpData[newUser.id]) pfpData[newUser.id] = [];

        pfpData[newUser.id].push({
          url: oldUser.displayAvatarURL({ dynamic: true, size: 1024 }),
          changedAt: new Date().toISOString(),
        });

        // Keep last 20 only
        if (pfpData[newUser.id].length > 20) {
          pfpData[newUser.id] = pfpData[newUser.id].slice(-20);
        }

        saveJSON(PFP_PATH, pfpData);
        log(`Tracked PFP change for ${newUser.username}`, 'debug');
      }

      // ---- TRACK USERNAME CHANGE ----
      if (oldUser.username !== newUser.username) {
        const nameData = loadJSON(NAME_PATH);
        if (!nameData[newUser.id]) nameData[newUser.id] = [];

        nameData[newUser.id].push({
          name: oldUser.username,
          changedAt: new Date().toISOString(),
        });

        // Keep last 20 only
        if (nameData[newUser.id].length > 20) {
          nameData[newUser.id] = nameData[newUser.id].slice(-20);
        }

        saveJSON(NAME_PATH, nameData);
        log(`Tracked username change for ${newUser.username} (was ${oldUser.username})`, 'debug');
      }

      // ---- TRACK BANNER CHANGE ----
      if (oldUser.banner !== newUser.banner) {
        const bannerData = loadJSON(BANNER_PATH);
        if (!bannerData[newUser.id]) bannerData[newUser.id] = [];

        const oldBannerURL = oldUser.bannerURL?.({ dynamic: true, size: 1024 }) || null;

        if (oldBannerURL) {
          bannerData[newUser.id].push({
            url: oldBannerURL,
            changedAt: new Date().toISOString(),
          });

          // Keep last 20 only
          if (bannerData[newUser.id].length > 20) {
            bannerData[newUser.id] = bannerData[newUser.id].slice(-20);
          }

          saveJSON(BANNER_PATH, bannerData);
          log(`Tracked banner change for ${newUser.username}`, 'debug');
        }
      }

    } catch (err) {
      log(`Error in tracking userUpdate: ${err.message}`, 'warn');
    }
  });

  log('PFP, username and banner tracking initialized', 'debug');
}

// ============================================
// DISPLAY BANNER
// ============================================

function displayBanner() {
  try {
    const coolGradient = gradient(["#00FFFF", "#0099FF", "#0033FF", "#0000FF"]);
    const asciiArt = figlet.textSync("Barro", {
      font: "Standard",
      horizontalLayout: "default",
      verticalLayout: "default",
      width: 80,
      whitespaceBreak: true,
    });

    console.log(chalk.cyan("> ") + chalk.gray("Barro selfbot initialized"));
console.log(chalk.cyan("> ") + chalk.gray("Private build"));
console.log(chalk.cyan("> ") + chalk.gray("Use responsibly"));
console.log(chalk.cyan("> ") + chalk.gray("Developed by Barro"));
    console.log("\n");
  } catch (error) {
    console.log("\n");
    console.log(chalk.cyan("=".repeat(50)));
    console.log(chalk.cyan("                     Barro SELFBOT"));
    console.log(chalk.cyan("=".repeat(50)));
    console.log("\n");
  }
}

// ============================================
// VALIDATE TOKEN
// ============================================

function validateToken(token) {
  if (!token) {
    return { isValid: false, error: "No token provided in config.yaml." };
  }
  if (typeof token !== "string") {
    return { isValid: false, error: "Token must be a string." };
  }
  if (!token.trim()) {
    return { isValid: false, error: "Token is empty." };
  }
  if (token.length < 50) {
    return { isValid: false, error: "Token appears to be too short." };
  }

  const placeholders = [
    "YOUR_TOKEN_HERE", "DISCORD_TOKEN", "TOKEN",
    "your_token", "paste_token_here", "YOUR_DISCORD_TOKEN",
  ];

  if (placeholders.some(p => token.toLowerCase().includes(p.toLowerCase()))) {
    return { isValid: false, error: "Token appears to be a placeholder." };
  }

  if (!token.includes(".")) {
    return { isValid: false, error: "Token format appears invalid." };
  }

  return { isValid: true, error: null };
}

// ============================================
// SIGNAL HANDLERS
// ============================================

function setupSignalHandlers(discordClient) {
  const gracefulShutdown = async (signal, exitCode = 0) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    log(`\nReceived ${signal} signal, shutting down...`, "warn");

    try {
      await TaskManager.cleanup();
      if (discordClient?.destroy) {
        discordClient.destroy();
      }
      log("Shutdown completed", "success");
    } catch (error) {
      log(`Error during shutdown: ${error.message}`, "error");
      exitCode = 1;
    } finally {
      setTimeout(() => process.exit(exitCode), 100);
    }
  };

  process.on("SIGINT", () => gracefulShutdown("SIGINT", 0));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM", 0));
  process.on("SIGQUIT", () => gracefulShutdown("SIGQUIT", 0));
  process.on("uncaughtException", (error) => {
    log(`Uncaught Exception: ${error.message}`, "error");
    gracefulShutdown("UNCAUGHT_EXCEPTION", 1);
  });
  process.on("unhandledRejection", (reason) => {
    log(`Unhandled Rejection: ${reason}`, "error");
    gracefulShutdown("UNHANDLED_REJECTION", 1);
  });
}

// ============================================
// MAIN INIT
// ============================================

async function initializeSelfbot() {
  try {
    log("Loading configuration...", "info");
    const config = loadConfig();

    log("Validating Discord token...", "info");
    const tokenValidation = validateToken(config.selfbot?.token);

    if (!tokenValidation.isValid) {
      console.error(chalk.red("\n[TOKEN ERROR] " + tokenValidation.error));
      process.exit(1);
    }

    log("Initializing Discord client...", "info");
    client = new Client({
      checkUpdate: false,
      autoRedeemNitro: true,
      relationshipSweepInterval: 60,
      restRequestTimeout: 60000,
      ws: {
        properties: {
          $browser: config.client_properties?.browser || "Discord Client",
        },
      },
    });

    client.config = config;
    client.prefix = config.selfbot.prefix;
    client.noprefix = false;
    client.commands = new Map();
    client.cooldowns = new Map();

    log("Setting up anti-crash system...", "info");
    setupAntiCrash(client);

    log("Setting up rate limit handler...", "info");
    setupRateLimit(client);

    log("Loading commands...", "info");
    const commandCount = await loadCommands(client);
    log(`Loaded ${commandCount} commands successfully`, "success");

    log("Loading events...", "info");
    const eventCount = await loadEvents(client);
    log(`Loaded ${eventCount} events successfully`, "success");

    log("Setting up signal handlers...", "info");
    setupSignalHandlers(client);

    await wait(1000);

    try {
      clearConsole();
    } catch {
      console.log("\n".repeat(10));
    }

    displayBanner();

    log("Connecting to Discord...", "info");

    try {
      await client.login(config.selfbot.token);
      log("Successfully connected to Discord!", "success");
    } catch (loginError) {
      if (loginError.message.includes("TOKEN_INVALID")) {
        console.error(chalk.red("\n[LOGIN ERROR] Invalid Discord token"));
      } else if (loginError.message.includes("RATE_LIMITED")) {
        console.error(chalk.red("\n[LOGIN ERROR] Rate limited by Discord"));
      } else {
        console.error(chalk.red("\n[LOGIN ERROR] " + loginError.message));
      }
      process.exit(1);
    }

    // Step 9: Initialize additional features
    log("Initializing additional features...", "debug");

    try {
      // Initialize Nitro sniper if enabled
      if (config.nitro_sniper?.enabled !== false) {
        initNitroSniper(client);
        log("Nitro sniper initialized", "debug");
      }

      // ✅ START TRACKING PFP, USERNAME AND BANNER
      setupTracking(client);

    } catch (featureError) {
      log(`Warning: Failed to initialize some features: ${featureError.message}`, "warn");
    }

    log("Selfbot initialization completed successfully!", "debug");
    log(`Bot is ready with prefix: ${client.prefix}`, "debug");

  } catch (error) {
    console.error(chalk.red("\n[INITIALIZATION ERROR] " + error.message));
    if (error.stack) console.error(chalk.gray(error.stack));
    if (client) {
      try { client.destroy(); } catch {}
    }
    process.exit(1);
  }
}

log("Starting Barro Selfbot...", "info");
initializeSelfbot().catch((error) => {
  console.error(chalk.red("\n[FATAL ERROR] " + error.message));
  process.exit(1);
});