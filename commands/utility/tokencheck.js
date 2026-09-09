import { log, loadConfig, style, formatAnsiBlock } from "../../utils/functions.js";
import axios from "axios";
import { THEME } from "../../utils/theme.js";

export default {
  name: "tokencheck",
  description: "Validate a token",
  aliases: ["checktoken", "validtoken"],
  usage: "<token>",
  category: "utility",
  type: "both",
  permissions: ["SendMessages"],
  cooldown: 30,

  execute: async (client, message, args) => {
    if (args[0] && ['help', '--help', '-h'].includes(args[0].toLowerCase())) {
      return message.channel.send(`> **TokenCheck Help**\n> Usage: \`${client.prefix}tokencheck <token>\`\n> Aliases: ${client.prefix}checktoken, ${client.prefix}validtoken`);
    }
    try {
      if (message.author.id !== client.user.id) return;

      try {
        await message.delete();
      } catch (error) {
        log(`Could not delete command message: ${error.message}`, "warn");
      }

      if (!args[0]) {
        return message.channel.send("> ❌ Please provide a token to check.");
      }

      const token = args[0];
      const config = loadConfig();
      const apiVersion = config?.api?.version || "v10";

      const statusMsg = await message.channel.send("> 🔍 Checking token validity...");

      try {
        const response = await axios({
          method: "GET",
          url: `https://discord.com/api/${apiVersion}/users/@me`,
          headers: { Authorization: token },
          validateStatus: () => true,
        });

        if (response.status === 200) {
          await statusMsg.edit(formatAnsiBlock([
            style("✅ Valid Token", THEME.HEADER_BOLD_COLOR),
            style("Info", THEME.LABEL_COLOR) + style(" | ", THEME.DIVIDER_COLOR) + style(`The token is valid and belongs to ${
              response.data.username
            }${
              response.data.discriminator !== "0"
                ? `#${response.data.discriminator}`
                : ""
            } (ID: ${response.data.id})`, THEME.ACCENT_COLOR)
          ]));
          log(`Token check: Valid token for ${response.data.username}`, "debug");
        } else if (response.status === 401) {
          await statusMsg.edit(formatAnsiBlock([
            style("❌ Invalid Token", THEME.HEADER_BOLD_COLOR),
            style("Result", THEME.LABEL_COLOR) + style(" | ", THEME.DIVIDER_COLOR) + style("The token is invalid or has been revoked.", THEME.ACCENT_COLOR)
          ]));
          log("Token check: Invalid token", "debug");
        } else {
          await statusMsg.edit(formatAnsiBlock([
            style("⚠️ Unknown Status", THEME.HEADER_BOLD_COLOR),
            style("Result", THEME.LABEL_COLOR) + style(" | ", THEME.DIVIDER_COLOR) + style(`The token check returned status code ${response.status}.`, THEME.ACCENT_COLOR)
          ]));
          log(`Token check: Unknown status ${response.status}`, "warn");
        }
      } catch (error) {
        await statusMsg.edit(formatAnsiBlock([
          style("❌ Error", THEME.HEADER_BOLD_COLOR),
          style("Result", THEME.LABEL_COLOR) + style(" | ", THEME.DIVIDER_COLOR) + style(`Failed to check token: ${error.message}`, THEME.ACCENT_COLOR)
        ]));
        log(`Error checking token: ${error.message}`, "error");
      }
    } catch (error) {
      log(`Error in tokencheck command: ${error.message}`, "error");
      message.channel.send(`> ❌ An error occurred: ${error.message}`);
    }
  },
};
