import { log, loadConfig } from "../../utils/functions.js";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store sniper configuration
let sniperConfig = {
  enabled: false,
  webhookUrl: "",
  notifyInvalid: false,
  notifyAlreadyRedeemed: true,
  checkFakeGifts: true,
  cooldown: 5000, // Cooldown between attempts in ms
  lastAttempt: 0,
  stats: {
    total: 0,
    invalid: 0,
    alreadyRedeemed: 0,
    ratelimited: 0,
    success: 0,
  },
};

// Regular expressions for matching gift links
const GIFT_REGEX =
  /(discord\.gift\/|discord\.com\/gifts\/|discordapp\.com\/gifts\/)[a-zA-Z0-9]{16,24}/g;
const CODE_REGEX = /[a-zA-Z0-9]{16,24}/;

export default {
  name: "nitrosniper",
  description: "Snipe Nitro gift codes automatically",
  aliases: ["sniper", "ns"],
  usage: "<on|off|status|stats|webhook|reset|settings>",
  category: "general",
  type: "both",
  permissions: ["SendMessages"],
  cooldown: 5,

  execute: async (client, message, args) => {
    try {
      if (message.author.id !== client.user.id) return;

      // Load saved config if available
      loadSniperConfig();

      // Check if a subcommand was provided
      if (!args[0]) {
        return message.channel.send(
          "> ❌ Please specify an action: `on`, `off`, `status`, `stats`, `webhook`, `reset`, or `settings`."
        );
      }

      const subcommand = args[0].toLowerCase();

      switch (subcommand) {
        case "on":
          // Enable the sniper
          sniperConfig.enabled = true;
          saveSniperConfig();
          await message.channel.send("> ✅ Nitro sniper has been **enabled**.");
          log("Nitro sniper enabled", "debug");
          break;

        case "off":
          // Disable the sniper
          sniperConfig.enabled = false;
          saveSniperConfig();
          await message.channel.send(
            "> ✅ Nitro sniper has been **disabled**."
          );
          log("Nitro sniper disabled", "debug");
          break;

        case "status":
          // Show current status
          await message.channel.send(
            `> 🔍 Nitro sniper is currently **${
              sniperConfig.enabled ? "enabled" : "disabled"
            }**.`
          );
          break;

        case "stats":
          // Show statistics
          const statsMessage = formatAnsiBlock([
            `📊 ${style("Nitro Sniper Statistics", "1;30")}`,
            `• ${style("Total codes detected:", "1;31")} ${sniperConfig.stats.total}`,
            `• ${style("Invalid codes:", "1;31")} ${sniperConfig.stats.invalid}`,
            `• ${style("Already redeemed:", "1;31")} ${sniperConfig.stats.alreadyRedeemed}`,
            `• ${style("Rate limited:", "1;31")} ${sniperConfig.stats.ratelimited}`,
            `• ${style("Successfully redeemed:", "1;31")} ${sniperConfig.stats.success}`,
          ]);

          await message.channel.send(statsMessage);
          break;

        case "webhook":
          // Set webhook URL
          if (args[1] === "clear") {
            sniperConfig.webhookUrl = "";
            saveSniperConfig();
            await message.channel.send("> ✅ Webhook URL has been cleared.");
          } else if (
            args[1] &&
            args[1].startsWith("https://discord.com/api/webhooks/")
          ) {
            sniperConfig.webhookUrl = args[1];
            saveSniperConfig();
            await message.channel.send("> ✅ Webhook URL has been set.");

            // Test the webhook
            try {
              await axios.post(sniperConfig.webhookUrl, {
                content: "🎁 Nitro Sniper webhook test successful!",
              });
            } catch (error) {
              await message.channel.send(
                "> ⚠️ Webhook URL was saved but the test failed. Please check the URL."
              );
            }
          } else {
            await message.channel.send(
              "> ❌ Please provide a valid Discord webhook URL or use `clear` to remove it."
            );
          }
          break;

        case "reset":
          // Reset statistics
          sniperConfig.stats = {
            total: 0,
            invalid: 0,
            alreadyRedeemed: 0,
            ratelimited: 0,
            success: 0,
          };
          saveSniperConfig();
          await message.channel.send(
            "> ✅ Nitro sniper statistics have been reset."
          );
          break;

        case "settings":
          // Toggle settings
          if (args[1]) {
            switch (args[1].toLowerCase()) {
              case "invalid":
                sniperConfig.notifyInvalid = !sniperConfig.notifyInvalid;
                await message.channel.send(
                  `> ✅ Invalid code notifications: **${
                    sniperConfig.notifyInvalid ? "enabled" : "disabled"
                  }**`
                );
                break;
              case "redeemed":
                sniperConfig.notifyAlreadyRedeemed =
                  !sniperConfig.notifyAlreadyRedeemed;
                await message.channel.send(
                  `> ✅ Already redeemed notifications: **${
                    sniperConfig.notifyAlreadyRedeemed ? "enabled" : "disabled"
                  }**`
                );
                break;
              case "fake":
                sniperConfig.checkFakeGifts = !sniperConfig.checkFakeGifts;
                await message.channel.send(
                  `> ✅ Fake gift checking: **${
                    sniperConfig.checkFakeGifts ? "enabled" : "disabled"
                  }**`
                );
                break;
              case "cooldown":
                if (args[2] && !isNaN(args[2])) {
                  const cooldown = parseInt(args[2]);
                  if (cooldown >= 1000) {
                    sniperConfig.cooldown = cooldown;
                    await message.channel.send(
                      `> ✅ Cooldown set to **${cooldown}ms**`
                    );
                  } else {
                    await message.channel.send(
                      "> ❌ Cooldown must be at least 1000ms (1 second)."
                    );
                  }
                } else {
                  await message.channel.send(
                    "> ❌ Please provide a valid cooldown in milliseconds."
                  );
                }
                break;
              default:
                await message.channel.send(
                  "> ❌ Invalid setting. Available settings: `invalid`, `redeemed`, `fake`, `cooldown`."
                );
            }
            saveSniperConfig();
          } else {
            // Show current settings
            const settingsMessage = formatAnsiBlock([
              `⚙️ ${style("Nitro Sniper Settings", "1;30")}`,
              `• ${style("Status:", "1;31")} ${sniperConfig.enabled ? "Enabled" : "Disabled"}`,
              `• ${style("Invalid code notifications:", "1;31")} ${sniperConfig.notifyInvalid ? "Enabled" : "Disabled"}`,
              `• ${style("Already redeemed notifications:", "1;31")} ${sniperConfig.notifyAlreadyRedeemed ? "Enabled" : "Disabled"}`,
              `• ${style("Fake gift checking:", "1;31")} ${sniperConfig.checkFakeGifts ? "Enabled" : "Disabled"}`,
              `• ${style("Cooldown:", "1;31")} ${sniperConfig.cooldown}ms`,
              `• ${style("Webhook:", "1;31")} ${sniperConfig.webhookUrl ? "Set" : "Not set"}`,
            ]);

            await message.channel.send(settingsMessage);
          }
          break;

        default:
          await message.channel.send(
            "> ❌ Invalid action. Available actions: `on`, `off`, `status`, `stats`, `webhook`, `reset`, `settings`."
          );
      }
    } catch (error) {
      log(`Error in nitrosniper command: ${error.message}`, "error");
      message.channel.send(`> ❌ An error occurred: ${error.message}`);
    }
  },
};

function style(text, colorCode) {
  return `\u001b[${colorCode}m${text}\u001b[0m`;
}

function formatAnsiBlock(lines) {
  return ["> ```ansi", ...lines.map((line) => `> ${line}`), "> ```"].join("\n");
}

/**
 * Initialize the Nitro sniper by registering the message event handler
 * @param {Client} client - Discord.js client
 */
export function initNitroSniper(client) {
  // Load saved config
  loadSniperConfig();

  // Register message event handler
  client.on("messageCreate", async (message) => {
    try {
      // Skip if sniper is disabled
      if (!sniperConfig.enabled) return;

      // Skip own messages
      if (message.author.id === client.user.id) return;

      // Check for gift links in the message
      const content = message.content;

      // Extract potential gift codes
      const matches = content.match(GIFT_REGEX);
      if (!matches) return;

      for (const match of matches) {
        // Extract the code from the match
        const codeMatch = match.match(CODE_REGEX);
        if (!codeMatch) continue;

        const code = codeMatch[0];

        // Check if the code is valid (16-24 characters)
        if (code.length < 16 || code.length > 24) {
          if (sniperConfig.notifyInvalid) {
            log(`Invalid Nitro code detected: ${code}`, "debug");
          }
          sniperConfig.stats.invalid++;
          sniperConfig.stats.total++;
          saveSniperConfig();
          continue;
        }

        // Check for cooldown
        const now = Date.now();
        if (now - sniperConfig.lastAttempt < sniperConfig.cooldown) {
          log(`Skipping Nitro code due to cooldown: ${code}`, "debug");
          continue;
        }

        sniperConfig.lastAttempt = now;

        // Attempt to redeem the code
        log(`Attempting to redeem Nitro code: ${code}`, "debug");
        sniperConfig.stats.total++;

        // Load config to get API version
        const config = loadConfig();
        const apiVersion = config?.api?.version || "v10";

        try {
          const response = await axios({
            method: "POST",
            url: `https://discord.com/api/${apiVersion}/entitlements/gift-codes/${code}/redeem`,
            headers: {
              Authorization: client.token,
              "Content-Type": "application/json",
            },
            data: {
              channel_id: message.channel.id,
            },
          });

          // Success!
          sniperConfig.stats.success++;
          saveSniperConfig();

          const successMessage = `🎉 Successfully redeemed Nitro code: ${code}`;
          log(successMessage, "success");

          // Send webhook notification if configured
          if (sniperConfig.webhookUrl) {
            try {
              await axios.post(sniperConfig.webhookUrl, {
                content: `🎉 **NITRO REDEEMED!**\nCode: \`${code}\`\nFrom: ${
                  message.author.tag
                }\nServer: ${
                  message.guild ? message.guild.name : "DM"
                }\nChannel: ${message.channel.name || "Unknown"}`,
              });
            } catch (webhookError) {
              log(
                `Failed to send webhook notification: ${webhookError.message}`,
                "error"
              );
            }
          }
        } catch (error) {
          // Handle different error cases
          if (error.response) {
            const status = error.response.status;
            const data = error.response.data;

            if (status === 400 && data.message === "Unknown Gift Code") {
              if (sniperConfig.notifyInvalid) {
                log(`Invalid Nitro code: ${code}`, "debug");
              }
              sniperConfig.stats.invalid++;
            } else if (
              status === 403 &&
              data.message === "This gift has been redeemed already."
            ) {
              if (sniperConfig.notifyAlreadyRedeemed) {
                log(`Nitro code already redeemed: ${code}`, "debug");
              }
              sniperConfig.stats.alreadyRedeemed++;
            } else if (status === 429) {
              log(
                `Rate limited while trying to redeem Nitro code: ${code}`,
                "warn"
              );
              sniperConfig.stats.ratelimited++;
            } else {
              log(
                `Failed to redeem Nitro code ${code}: ${
                  data.message || status
                }`,
                "error"
              );
            }
          } else {
            log(
              `Error redeeming Nitro code ${code}: ${error.message}`,
              "error"
            );
          }
          saveSniperConfig();
        }
      }
    } catch (error) {
      log(`Error in Nitro sniper: ${error.message}`, "error");
    }
  });

  log("Nitro sniper initialized", "debug");
}

/**
 * Load sniper configuration from file
 */
function loadSniperConfig() {
  try {
    const configPath = path.join(__dirname, "../../data/nitrosniper.json");

    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, "utf8");
      const loadedConfig = JSON.parse(data);

      // Update config with loaded values
      sniperConfig = { ...sniperConfig, ...loadedConfig };

      log("Loaded Nitro sniper configuration", "debug");
    }
  } catch (error) {
    log(`Failed to load Nitro sniper configuration: ${error.message}`, "error");
  }
}

/**
 * Save sniper configuration to file
 */
function saveSniperConfig() {
  try {
    const configPath = path.join(__dirname, "../../data/nitrosniper.json");
    const dataDir = path.join(__dirname, "../../data");

    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Write config to file
    fs.writeFileSync(configPath, JSON.stringify(sniperConfig, null, 2), "utf8");

    log("Saved Nitro sniper configuration", "debug");
  } catch (error) {
    log(`Failed to save Nitro sniper configuration: ${error.message}`, "error");
  }
}
