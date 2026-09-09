import { log, loadConfig } from "../../utils/functions.js";
import axios from "axios";
import { THEME } from "../../utils/theme.js";

export default {
  name: "hypesquad",
  description: "Change your HypeSquad house",
  aliases: ["house", "hs"],
  usage: "<bravery|brilliance|balance|leave>",
  category: "general",
  type: "both",
  permissions: ["SendMessages"],
  cooldown: 60,

  execute: async (client, message, args) => {
    try {
      if (message.author.id !== client.user.id) return;

      // Check if a house was specified
      if (!args[0]) {
        return message.channel.send(formatAnsiBlock([
          style('[ HYPESQUAD ]', THEME.HEADER_BOLD_COLOR),
          '',
          style('USAGE:', THEME.LABEL_COLOR) + ' ' + style(`${client.prefix}hypesquad <bravery|brilliance|balance|leave>`, THEME.ACCENT_COLOR)
        ]));
      }

      // Load config to get API version
      const config = loadConfig();
      const apiVersion = config?.api?.version || "10"; // Default to v10 if not specified

      // Determine which house to join
      const house = args[0].toLowerCase();
      let houseId;
      let houseName;

      switch (house) {
        case "bravery":
          houseId = 1;
          houseName = "Bravery";
          break;
        case "brilliance":
          houseId = 2;
          houseName = "Brilliance";
          break;
        case "balance":
          houseId = 3;
          houseName = "Balance";
          break;
        case "leave":
          houseId = null;
          houseName = "None";
          break;
        default:
          return message.channel.send(formatAnsiBlock([
            style('[ HYPESQUAD ]', THEME.HEADER_BOLD_COLOR),
            '',
            style('ERROR:', THEME.LABEL_COLOR) + ' ' + style('Invalid house. Please choose bravery, brilliance, balance, or leave.', THEME.ACCENT_COLOR)
          ]));
      }

      // Send initial message
      const statusMsg = await message.channel.send(formatAnsiBlock([
        style('[ HYPESQUAD ]', THEME.HEADER_BOLD_COLOR),
        '',
        style('STATUS:', THEME.LABEL_COLOR) + ' ' + style(houseId === null ? 'Leaving HypeSquad...' : `Changing to ${houseName}...`, THEME.ACCENT_COLOR)
      ]));

      try {
        if (houseId === null) {
          // Leave HypeSquad
          await axios({
            method: "DELETE",
            url: `https://discord.com/api/${apiVersion}/hypesquad/online`,
            headers: {
              Authorization: client.token,
              "Content-Type": "application/json",
            },
          });

          await statusMsg.edit(formatAnsiBlock([
            style('[ HYPESQUAD ]', THEME.HEADER_BOLD_COLOR),
            '',
            style('SUCCESS:', THEME.LABEL_COLOR) + ' ' + style('Successfully left HypeSquad.', THEME.ACCENT_COLOR)
          ]));
          log("Left HypeSquad", "debug");
        } else {
          // Join a HypeSquad house
          await axios({
            method: "POST",
            url: `https://discord.com/api/${apiVersion}/hypesquad/online`,
            headers: {
              Authorization: client.token,
              "Content-Type": "application/json",
            },
            data: {
              house_id: houseId,
            },
          });

          await statusMsg.edit(formatAnsiBlock([
            style('[ HYPESQUAD ]', THEME.HEADER_BOLD_COLOR),
            '',
            style('SUCCESS:', THEME.LABEL_COLOR) + ' ' + style(`Successfully joined HypeSquad ${houseName}.`, THEME.ACCENT_COLOR)
          ]));
          log(`Changed HypeSquad house to ${houseName}`, "debug");
        }
      } catch (error) {
        await statusMsg.edit(formatAnsiBlock([
          style('[ HYPESQUAD ]', THEME.HEADER_BOLD_COLOR),
          '',
          style('ERROR:', THEME.LABEL_COLOR) + ' ' + style(`Failed to change HypeSquad house: ${error.message}`, THEME.ACCENT_COLOR)
        ]));
        log(`Error changing HypeSquad house: ${error.message}`, 'error');
      }
    } catch (error) {
      log(`Error in hypesquad command: ${error.message}`, 'error');
      message.channel.send(formatAnsiBlock([
        style('[ HYPESQUAD ]', THEME.HEADER_BOLD_COLOR),
        '',
        style('ERROR:', THEME.LABEL_COLOR) + ' ' + style(`An error occurred: ${error.message}`, THEME.ACCENT_COLOR)
      ]));
    }
  },
};

function style(text, colorCode) {
  return `\u001b[${colorCode}m${text}\u001b[0m`;
}

function formatAnsiBlock(lines) {
  return ['> ```ansi', ...lines.map(line => `> ${line}`), '> ```'].join('\n');
}
