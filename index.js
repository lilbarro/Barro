import pkg from "discord.js-selfbot-v13";
const { Client } = pkg;
import chalk from "chalk";
import figlet from "figlet";
import gradient from "gradient-string";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import readline from "readline";

import { loadEvents } from "./handlers/EventsHandler.js";
import { loadCommands } from "./handlers/CommandHandler.js";
import { setupAntiCrash } from "./handlers/anticrash.js";
import { setupRateLimit } from "./handlers/RateLimitHandler.js";
import { loadConfig, clearConsole, log, wait, style, loadJSONAsync, saveJSONAsync } from "./utils/functions.js";
import { getUserPrefix } from "./utils/userPrefixManager.js";
import TaskManager from "./utils/TaskManager.js";
import { initNitroSniper } from "./commands/fun/nitrosniper.js";

let isShuttingDown = false;
<<<<<<< HEAD
let clients = [];
let isLoggedIn = false; // True if at least one client is connected
=======
let client = null;
let isLoggedIn = false;
>>>>>>> origin/main
let logoutCooldownTimer = 0;
let logoutCooldownActive = false;

// ============================================
// STYLING & FORMATTING HELPERS
// ============================================

<<<<<<< HEAD
function displaySimpleMenu() {
  console.log('\n' + style('Available Commands:', '0;36'));
  console.log(style('login', '1;37') + '    | Start all bots');
  console.log(style('logout', '1;37') + '   | Turn off all bots');
  console.log(style('restart', '1;37') + '  | Restart all bots');
  console.log(style('status', '1;37') + '   | Check the status of bots');
=======
function style(text, colorCode) {
  return `\u001b[${colorCode}m${text}\u001b[0m`;
}

function displaySimpleMenu() {
  console.log('\n' + style('Available Commands:', '0;36'));
  console.log(style('login', '1;37') + '    | Start the bot');
  console.log(style('logout', '1;37') + '   | Turn the bot off');
  console.log(style('restart', '1;37') + '  | Restart the bot');
  console.log(style('status', '1;37') + '   | Check the status of bot');
>>>>>>> origin/main
  console.log(style('exit', '1;37') + '     | Exit the terminal\n');
}

// ============================================
// TRACKING HELPER FUNCTIONS
// ============================================

async function setupTracking(client) {
  const PFP_PATH = resolve('./data/pfphistory.json');
  const NAME_PATH = resolve('./data/namehistory.json');
  const BANNER_PATH = resolve('./data/bannerhistory.json');

  client.on('userUpdate', async (oldUser, newUser) => {
    try {
<<<<<<< HEAD
=======
      // Fetch full profile to get banner
>>>>>>> origin/main
      let fullOldUser = oldUser;
      let fullNewUser = newUser;

      try {
        fullNewUser = await client.users.fetch(newUser.id, { force: true });
      } catch {
        // Keep original
      }

      // ---- TRACK PFP CHANGE ----
      if (oldUser.avatar !== newUser.avatar) {
        const pfpData = await loadJSONAsync(PFP_PATH);
        if (!pfpData[newUser.id]) pfpData[newUser.id] = [];

        pfpData[newUser.id].push({
          url: oldUser.displayAvatarURL({ dynamic: true, size: 1024 }),
          changedAt: new Date().toISOString(),
        });

        if (pfpData[newUser.id].length > 20) {
          pfpData[newUser.id] = pfpData[newUser.id].slice(-20);
        }

        await saveJSONAsync(PFP_PATH, pfpData);
        log(`Tracked PFP change for ${newUser.username}`, 'debug', client.user?.username || 'Unknown');
      }

      // ---- TRACK USERNAME CHANGE ----
      if (oldUser.username !== newUser.username) {
        const nameData = await loadJSONAsync(NAME_PATH);
        if (!nameData[newUser.id]) nameData[newUser.id] = [];

        nameData[newUser.id].push({
          name: oldUser.username,
          changedAt: new Date().toISOString(),
        });

        if (nameData[newUser.id].length > 20) {
          nameData[newUser.id] = nameData[newUser.id].slice(-20);
        }

        await saveJSONAsync(NAME_PATH, nameData);
        log(`Tracked username change for ${newUser.username} (was ${oldUser.username})`, 'debug', client.user?.username || 'Unknown');
      }

      // ---- TRACK BANNER CHANGE ----
      if (oldUser.banner !== newUser.banner) {
        const bannerData = await loadJSONAsync(BANNER_PATH);
        if (!bannerData[newUser.id]) bannerData[newUser.id] = [];

        const oldBannerURL = oldUser.bannerURL?.({ dynamic: true, size: 1024 }) || null;

        if (oldBannerURL) {
          bannerData[newUser.id].push({
            url: oldBannerURL,
            changedAt: new Date().toISOString(),
          });

          if (bannerData[newUser.id].length > 20) {
            bannerData[newUser.id] = bannerData[newUser.id].slice(-20);
          }

          await saveJSONAsync(BANNER_PATH, bannerData);
          log(`Tracked banner change for ${newUser.username}`, 'debug', client.user?.username || 'Unknown');
        }
      }

    } catch (err) {
      log(`Error in tracking userUpdate: ${err.message}`, 'debug', client.user?.username || 'Unknown');
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
// BOT CONTROL FUNCTIONS
// ============================================

function startLogoutCooldown() {
  logoutCooldownActive = true;
  logoutCooldownTimer = 60;

  const countdownInterval = setInterval(() => {
    logoutCooldownTimer--;
    if (logoutCooldownTimer % 10 === 0 || logoutCooldownTimer <= 5) {
      console.log(style(`Auto-login available in ${logoutCooldownTimer}s...`, '0;33'));
    }

    if (logoutCooldownTimer <= 0) {
      clearInterval(countdownInterval);
      logoutCooldownActive = false;
      console.log(style('Ready to login again', '0;32'));
    }
  }, 1000);
}

function getLogoutStatus() {
  if (!logoutCooldownActive) return null;
  return logoutCooldownTimer;
}

<<<<<<< HEAD
async function loginBots(clients, config) {
  if (isLoggedIn) {
    console.log(style('At least one bot is already connected to Discord', '1;33'));
=======
async function loginBot(discordClient, config) {
  if (isLoggedIn) {
    console.log(style('Already connected to Discord', '1;33'));
>>>>>>> origin/main
    return;
  }

  if (logoutCooldownActive) {
    console.log(style(`Login blocked for ${logoutCooldownTimer}s to avoid rate limiting...`, '1;33'));
    console.log(style('Waiting before auto-login...', '0;36'));
<<<<<<< HEAD

=======
    
    // Wait for cooldown to finish
>>>>>>> origin/main
    while (logoutCooldownTimer > 0) {
      await new Promise(r => setTimeout(r, 1000));
    }
    console.log(style('Cooldown expired, proceeding with login...', '0;32'));
  }

  try {
<<<<<<< HEAD
    console.log(style('Connecting all accounts to Discord...', '0;36'));

    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      const account = config.selfbot.accounts ? config.selfbot.accounts[i] : null;
      const token = account ? account.token : (config.selfbot.token);
      const accLabel = `Acc ${i + 1}`;

      try {
        await client.login(token);

        // Assign the correct prefix after login
        const fallbackPrefix = account?.prefix || config.selfbot.prefix || ',';
        client.prefix = getUserPrefix(client.user.id, fallbackPrefix, client.user.id);

        log(`Connected successfully`, 'success', accLabel);

        if (config.nitro_sniper?.enabled !== false) {
          try {
            initNitroSniper(client);
            log("Nitro sniper initialized", "debug", accLabel);
          } catch (err) {
            log(`Warning: Failed to initialize Nitro sniper: ${err.message}`, "warn", accLabel);
          }
        }
      } catch (err) {
        log(`Connection failed: ${err.message}`, 'error', accLabel);
      }
    }

    isLoggedIn = true;
  } catch (err) {
    isLoggedIn = false;
    console.log(style(`Critical error during multi-login: ${err.message}`, '1;31'));
  }
}

async function logoutBots(clients, config) {
  if (!isLoggedIn && clients.length === 0) {
    console.log(style('No bots connected to Discord', '1;33'));
=======
    console.log(style('Connecting to Discord...', '0;36'));
    await discordClient.login(config.selfbot.token);
    isLoggedIn = true;
    console.log(style('Connected successfully', '0;32'));

    if (config.nitro_sniper?.enabled !== false) {
      try {
        initNitroSniper(discordClient);
        log("Nitro sniper initialized", "debug");
      } catch (err) {
        log(`Warning: Failed to initialize Nitro sniper: ${err.message}`, "warn");
      }
    }
  } catch (err) {
    isLoggedIn = false;
    console.log(style(`Connection failed: ${err.message}`, '1;31'));
  }
}

async function logoutBot(discordClient, config) {
  if (!isLoggedIn) {
    console.log(style('Not connected to Discord', '1;33'));
>>>>>>> origin/main
    return;
  }

  try {
<<<<<<< HEAD
    console.log(style('Disconnecting all bots from Discord...', '0;36'));

    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      const accLabel = `Acc ${i + 1}`;
      try {
        await client.destroy();
        log(`Disconnected successfully`, 'success', accLabel);
      } catch (err) {
        log(`Disconnect failed: ${err.message}`, 'error', accLabel);
      }
    }

    isLoggedIn = false;
    const shutdownTime = Math.random() * 10 + 5;
    console.log(style(`Cleaning up (${Math.round(shutdownTime)}s)...`, '0;33'));

    await new Promise(r => setTimeout(r, shutdownTime * 1000));

    startLogoutCooldown();

    // Re-initialize clients array
    clients.length = 0;
    const accounts = config.selfbot.accounts || (config.selfbot.token ? [{ token: config.selfbot.token }] : []);

    for (const acc of accounts) {
      const newClient = new Client({
        checkUpdate: false,
        autoRedeemNitro: true,
        relationshipSweepInterval: 60,
        restRequestTimeout: 60000,
        partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER', 'GUILD_MEMBER'],
        ws: {
          properties: {
            $browser: config.client_properties?.browser || "Discord Client",
          },
        },
      });

      newClient.config = config;
      newClient.noprefix = false;
      newClient.commands = new Map();
      newClient.cooldowns = new Map();

      setupAntiCrash(newClient);
      setupRateLimit(newClient);

      clients.push(newClient);
    }

  } catch (err) {
    console.log(style(`Critical logout error: ${err.message}`, '1;31'));
  }
}

async function restartBots(clients, config) {
  console.log(style('Restarting all bots...', '0;36'));
  await logoutBots(clients, config);

  while (logoutCooldownTimer > 0) {
    await new Promise(r => setTimeout(r, 1000));
  }

  await loginBots(clients, config);
=======
    console.log(style('Disconnecting from Discord...', '0;36'));
    await discordClient.destroy();
    isLoggedIn = false;

    // Simulate human-like slow shutdown (5-15 seconds)
    const shutdownTime = Math.random() * 10 + 5; // 5-15 seconds
    console.log(style(`Cleaning up (${Math.round(shutdownTime)}s)...`, '0;33'));

    await new Promise(r => setTimeout(r, shutdownTime * 1000));
    
    console.log(style('Disconnected successfully', '0;32'));
    
    // Start cooldown timer
    startLogoutCooldown();

    // Reinitialize client for next login
    discordClient = new Client({
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

    discordClient.config = config;
    discordClient.prefix = config.selfbot.prefix;
    discordClient.noprefix = false;
    discordClient.commands = new Map();
    discordClient.cooldowns = new Map();

    setupAntiCrash(discordClient);
    setupRateLimit(discordClient);

    client = discordClient;
  } catch (err) {
    console.log(style(`Disconnect failed: ${err.message}`, '1;31'));
  }
}

async function restartBot(discordClient, config) {
  console.log(style('Restarting bot...', '0;36'));
  await logoutBot(discordClient, config);
  
  // Wait for cooldown
  while (logoutCooldownTimer > 0) {
    await new Promise(r => setTimeout(r, 1000));
  }
  
  await loginBot(discordClient, config);
>>>>>>> origin/main
}

// ============================================
// TERMINAL INTERFACE SETUP
// ============================================

<<<<<<< HEAD
function setupTerminalInterface(clients, config) {
=======
function setupTerminalInterface(discordClient, config) {
>>>>>>> origin/main
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  displaySimpleMenu();

  const prompt = () => {
    rl.question(style('> ', '0;36'), async (input) => {
      const command = input.trim().toLowerCase();

      switch (command) {
        case 'login':
<<<<<<< HEAD
          await loginBots(clients, config);
          break;

        case 'logout':
          await logoutBots(clients, config);
          break;

        case 'restart':
          await restartBots(clients, config);
=======
          await loginBot(discordClient, config);
          break;

        case 'logout':
          await logoutBot(discordClient, config);
          break;

        case 'restart':
          await restartBot(discordClient, config);
>>>>>>> origin/main
          break;

        case 'status':
          console.log('');
<<<<<<< HEAD
          if (clients.length === 0) {
            console.log(style('No bots configured', '1;31'));
          } else {
            clients.forEach((client, index) => {
              const accLabel = `Acc ${index + 1}`;
              const connected = client.user ? style('Connected', '0;32') : style('Disconnected', '1;31');
              const prefix = client.prefix || 'None';
              console.log(style(`${accLabel} Status: `, '0;36') + connected + style(` | Prefix: ${prefix}`, '0;37'));
              if (client.user) {
                console.log(style(`${accLabel} Account: `, '0;36') + client.user.username);
              }
            });
=======
          if (isLoggedIn) {
            console.log(style('Status: ', '0;36') + style('Connected', '0;32'));
            console.log(style('Account: ', '0;36') + (discordClient.user?.username || 'Unknown'));
            console.log(style('Prefix: ', '0;36') + config.selfbot.prefix);
          } else {
            console.log(style('Status: ', '0;36') + style('Disconnected', '1;31'));
            if (logoutCooldownActive) {
              console.log(style('Cooldown: ', '0;36') + `${logoutCooldownTimer}s remaining`);
            }
>>>>>>> origin/main
          }
          console.log('');
          break;

        case 'exit':
          console.log(style('Exiting...', '0;33'));
          await gracefulShutdown('USER_COMMAND', 0, rl);
          return;

        case 'help':
          displaySimpleMenu();
          prompt();
          return;

        case '':
          prompt();
          return;

        default:
          console.log(style('Unknown command. Type "help" for available commands.', '1;31'));
          break;
      }

      prompt();
    });
  };

  prompt();
}

async function gracefulShutdown(signal, exitCode = 0, rl = null) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  log(`\nReceived ${signal} signal, shutting down...`, "warn");

  try {
    if (rl) {
      rl.close();
    }
    await TaskManager.cleanup();
<<<<<<< HEAD

    for (const client of clients) {
      if (client?.destroy) {
        await client.destroy();
      }
=======
    if (client?.destroy) {
      await client.destroy();
>>>>>>> origin/main
    }
    log("Shutdown completed", "success");
  } catch (error) {
    log(`Error during shutdown: ${error.message}`, "error");
    exitCode = 1;
  } finally {
    setTimeout(() => process.exit(exitCode), 100);
  }
}

// ============================================
// SIGNAL HANDLERS
// ============================================

<<<<<<< HEAD
function setupSignalHandlers() {
=======
function setupSignalHandlers(discordClient) {
>>>>>>> origin/main
  const handleSignal = async (signal, exitCode = 0) => {
    await gracefulShutdown(signal, exitCode);
  };

  process.on("SIGINT", () => handleSignal("SIGINT", 0));
  process.on("SIGTERM", () => handleSignal("SIGTERM", 0));
  process.on("SIGQUIT", () => handleSignal("SIGQUIT", 0));
  process.on("uncaughtException", (error) => {
    log(`Uncaught Exception: ${error.message}`, "error");
    handleSignal("UNCAUGHT_EXCEPTION", 1);
  });
  process.on("unhandledRejection", (reason) => {
    log(`Unhandled Rejection: ${reason}`, "error");
    handleSignal("UNHANDLED_REJECTION", 1);
  });
}

// ============================================
// MAIN INIT
// ============================================

async function initializeSelfbot() {
  try {
    log("Loading configuration...", "info");
    const config = loadConfig();

<<<<<<< HEAD
    const accounts = config.selfbot.accounts || (config.selfbot.token ? [{ token: config.selfbot.token }] : []);
    if (accounts.length === 0) {
      console.error(chalk.red("\n[TOKEN ERROR] No accounts provided in config.yaml."));
      process.exit(1);
    }

    log(`Validating accounts...`, "info");
    const validAccounts = [];
    for (let i = 0; i < accounts.length; i++) {
      const acc = accounts[i];
      const token = acc && typeof acc === 'object' ? acc.token : acc;
      if (!token || (typeof token === 'string' && token.trim() === "")) {
        log(`Skipping Account ${i + 1}: No token provided.`, 'debug');
        continue;
      }
      const validation = validateToken(token);
      if (!validation.isValid) {
        log(`Skipping Account ${i + 1}: ${validation.error}`, 'warn');
        continue;
      }
      validAccounts.push(accounts[i]);
    }

    if (validAccounts.length === 0) {
      console.error(chalk.red("\n[TOKEN ERROR] No valid tokens found. Bot cannot start."));
      process.exit(1);
    }

    log(`Initializing ${validAccounts.length} Discord clients...`, "info");

    clients = validAccounts.map((acc, index) => {
      const token = acc.token || acc;
      const client = new Client({
        checkUpdate: false,
        autoRedeemNitro: true,
        relationshipSweepInterval: 60,
        restRequestTimeout: 60000,
        partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER', 'GUILD_MEMBER'],
        ws: {
          properties: {
            $browser: config.client_properties?.browser || "Discord Client",
          },
        },
      });

      client.config = config;
      client.prefix = acc.prefix || config.selfbot.prefix;
      client.noprefix = false;
      client.commands = new Map();
      client.cooldowns = new Map();

      setupAntiCrash(client);
      setupRateLimit(client);

      return client;
=======
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
>>>>>>> origin/main
    });

    log("Commands", "info");
    let totalCommands = 0;
    for (const client of clients) {
      const count = await loadCommands(client);
      if (totalCommands === 0) totalCommands = count;
    }
    log(`Loaded ${totalCommands} unique commands for all ${clients.length} accounts`, "success");

    log("Events", "info");
    for (const client of clients) {
      await loadEvents(client);
    }
    log(`Loaded events for all ${clients.length} accounts`, "success");

    setupSignalHandlers();

    await wait(1000);

    try {
      clearConsole();
    } catch {
      console.log("\n".repeat(10));
    }

    // displayBanner(); // Disabled to reduce terminal noise

<<<<<<< HEAD

    console.log(style('\nBot initialized and ready', '0;36'));

    isLoggedIn = false;

    try {
      if (config.nitro_sniper?.enabled !== false) {
        log("Nitro sniper ready", "debug");
      }

      for (const client of clients) {
        setupTracking(client);
      }
=======
    // Don't auto-login - wait for user command instead
    console.log(style('\nBot initialized and ready', '0;36'));

    isLoggedIn = false;

    // Step 9: Initialize additional features (but don't start them yet)
    log("Initializing additional features...", "debug");

    try {
      // Initialize Nitro sniper if enabled (but don't activate until logged in)
      if (config.nitro_sniper?.enabled !== false) {
        log("Nitro sniper ready (will activate on login)", "debug");
      }

      // ✅ START TRACKING PFP, USERNAME AND BANNER (will work after login)
      setupTracking(client);

>>>>>>> origin/main
    } catch (featureError) {
      log(`Warning: Failed to initialize some features: ${featureError.message}`, "warn");
    }

<<<<<<< HEAD
    log(`Multi-account initialization completed successfully! (${clients.length} accounts)`, "debug");
=======
    log("Selfbot initialization completed successfully!", "debug");
>>>>>>> origin/main

    return config;
  } catch (error) {
    console.error(chalk.red("\n[INITIALIZATION ERROR] " + error.message));
    if (error.stack) console.error(chalk.gray(error.stack));
    if (clients.length > 0) {
      try {
        for (const c of clients) c.destroy();
      } catch {}
    }
    process.exit(1);
  }
}

<<<<<<< HEAD
log("Starting Barro Multi-Account Selfbot...", "info");
initializeSelfbot().then((config) => {
  setupTerminalInterface(clients, config);
=======
log("Starting Barro Selfbot...", "info");
initializeSelfbot().then((config) => {
  setupTerminalInterface(client, config);
>>>>>>> origin/main
}).catch((error) => {
  console.error(chalk.red("\n[FATAL ERROR] " + error.message));
  process.exit(1);
});
