<<<<<<< HEAD
import { log, style, formatAnsiBlock, formatAnsiBlocks } from "../../utils/functions.js";
import { THEME } from "../../utils/theme.js";

export default {
  name: "support",
  description: "Show support links",
=======
import { log } from "../../utils/functions.js";

export default {
  name: "support",
  description: "Get support links and developer contact information",
>>>>>>> origin/main
  aliases: ["contact", "dev"],
  usage: "",
  category: "settings",
  type: "both",
  permissions: ["SendMessages"],
  cooldown: 5,

  async execute(client, message, args) {
<<<<<<< HEAD
    if (args[0] && ["help", "--help", "-h"].includes(args[0].toLowerCase())) {
      return message.channel.send(`> **Support Help**\n> Usage: \`${client.prefix}support\`\n> Aliases: \`${client.prefix}contact\`, \`${client.prefix}dev\``);
    }

    try {
      const block1 = formatAnsiBlock([
        style(`Barro`, THEME.HEADER_BOLD_COLOR) + style(` Support Information`, THEME.ACCENT_COLOR)
      ]);

      const block2 = formatAnsiBlock([
        style('Resources', THEME.HEADER_BOLD_COLOR),
=======
    try {
      const block1 = formatAnsiBlock([
        style(`Barro`, `4;30`) + style(` Support Information`, '0;34')
      ]);

      const block2 = formatAnsiBlock([
        style('Resources', '4;30'),
>>>>>>> origin/main
        kv('GitHub', 'github.com/lilbarro/Barro', 12),
        kv('Discord ', 'discord.gg/kd3ux3fMzr', 12),
        kv('Discord ID', 'barro.x', 12)
      ]);

      const block3 = formatAnsiBlock([
<<<<<<< HEAD
        style('Information', THEME.HEADER_BOLD_COLOR),
        kv('Developer', 'barro.x2', 12),
        kv('Co-Dev', 'None', 12),
        '',
        style('NOTICE:', THEME.LABEL_COLOR) + ' ' + style('Selfbots violate Discord ToS.', THEME.ACCENT_COLOR),
        style('RISK  :', THEME.LABEL_COLOR) + ' ' + style('Use at your own risk.', THEME.ACCENT_COLOR)
      ]);

      await message.channel.send(formatAnsiBlocks([block1, block2, block3]));
=======
        style('Information', '4;30'),
        kv('Developer', 'barro.x', 12),
        kv('Co-Dev', 'None', 12),
        '',
        style('NOTICE:', '0;97') + ' ' + style('Selfbots violate Discord ToS.', '0;34'),
        style('RISK  :', '0;97') + ' ' + style('Use at your own risk.', '0;34')
      ]);

      await message.channel.send([block1, block2, block3].join('\n'));
>>>>>>> origin/main

      log(`Support command used by ${message.author.tag}`, "debug");
    } catch (error) {
      log(`Error in support command: ${error.message}`, "error");
      message.channel.send(formatAnsiBlock([
<<<<<<< HEAD
        style(`ERROR: An error occurred while displaying support.`, THEME.ACCENT_COLOR)
=======
        style(`ERROR: An error occurred while displaying support.`, '1;94')
>>>>>>> origin/main
      ]));
    }
  },
};

<<<<<<< HEAD
function kv(label, value, padTo) {
  const padded = String(label).padEnd(padTo, ' ');
  return style(padded, THEME.LABEL_COLOR) + style(' | ', THEME.DIVIDER_COLOR) + style(String(value), THEME.ACCENT_COLOR);
}
=======
function style(text, colorCode) {
  return `\u001b[${colorCode}m${text}\u001b[0m`;
}

function formatAnsiBlock(lines) {
  return ['> ```ansi', ...lines.map(line => `> ${line}`), '> ```'].join('\n');
}

function kv(label, value, padTo) {
  const padded = String(label).padEnd(padTo, ' ');
  return style(padded, '0;97') + style(' | ', '0;30') + style(String(value), '0;34');
}
>>>>>>> origin/main
