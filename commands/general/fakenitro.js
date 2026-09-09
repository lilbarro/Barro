import { log } from "../../utils/functions.js";
import { THEME } from "../../utils/theme.js";

export default {
  name: "fakenitro",
  description: "Generate simulated Nitro links",
  aliases: ["nitro", "freegift"],
  usage: "[amount]",
  category: "general",
  type: "both",
  permissions: ["SendMessages"],
  cooldown: 30,

  execute: async (client, message, args) => {
    if (args[0] && ['help', '--help', '-h'].includes(args[0].toLowerCase())) {
      return message.channel.send(`> **FakeNitro Help**\n> Usage: \`${client.prefix}fakenitro [amount]\` (1-10 links)\n> Aliases: ${client.prefix}nitro, ${client.prefix}freegift`);
    }
    try {
      if (message.author.id !== client.user.id) return;

      // Determine how many links to generate (default: 1)
      let amount = 1;
      if (args[0] && !isNaN(args[0])) {
        amount = parseInt(args[0]);

        // Limit to a reasonable number
        if (amount < 1) amount = 1;
        if (amount > 10) amount = 10;
      }

      // Generate the specified number of fake Nitro links
      const links = [];
      for (let i = 0; i < amount; i++) {
        links.push(generateFakeNitroLink());
      }

      // Send the links
      const giftLines = [
        style('[ FAKENITRO ]', THEME.HEADER_BOLD_COLOR),
        '',
        style('GIFTS GENERATED:', THEME.LABEL_COLOR) + ' ' + style(links.length.toString(), THEME.ACCENT_COLOR)
      ];
      links.forEach((link, index) => {
        giftLines.push(style(`${index + 1}.`, THEME.LABEL_COLOR) + ' ' + style(link, THEME.ACCENT_COLOR));
      });
      await message.channel.send(formatAnsiBlock(giftLines));

      log(`Generated ${links.length} fake Nitro gift links`, "debug");
    } catch (error) {
      log(`Error in fakenitro command: ${error.message}`, "error");
      message.channel.send(formatAnsiBlock([
        style('[ FAKENITRO ]', THEME.HEADER_BOLD_COLOR),
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

/**
 * Generate a fake Nitro gift link
 * @returns {string} Fake Nitro gift link
 */
function generateFakeNitroLink() {
  // Generate a random 16-character code
  const code = Array(16)
    .fill(0)
    .map(() => {
      const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      return chars.charAt(Math.floor(Math.random() * chars.length));
    })
    .join("");

  // Choose a random gift type
  const giftTypes = [
    "discord.gift/",
    "https://discord.gift/",
    "https://discord.com/gifts/",
  ];

  const giftType = giftTypes[Math.floor(Math.random() * giftTypes.length)];

  // Return the complete fake gift link
  return `${giftType}${code}`;
}
