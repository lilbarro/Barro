import { log } from "../../utils/functions.js";
import { setUserPrefix, getUserPrefix } from "../../utils/userPrefixManager.js";
import { THEME } from "../../utils/theme.js";
import { formatHeaderTitle } from "../../utils/functions.js";

export default {
  name: 'prefix',
  description: 'Change the command prefix',
  aliases: ['setprefix', 'changeprefix'],
  usage: '<new_prefix>',
  category: 'settings',
  type: 'both',
  permissions: [],
  cooldown: 10,
  ownerOnly: false,

  async execute(client, message, args) {
    try {
      if (args[0] && ['help', '--help', '-h'].includes(args[0].toLowerCase())) {
        return message.channel.send(`> **Prefix Help**\n> Usage: \`${client.prefix}prefix <new_prefix>\`\n> Aliases: \`${client.prefix}setprefix\`, \`${client.prefix}changeprefix\`\n> Prefixes can be up to 5 characters.`);
      }

      if (message.author.id !== client.user?.id) return;

      const newPrefix = args[0];

      if (!newPrefix) {
        return message.channel.send(formatThreeBlock('Barro Prefix', [['Status', 'Error']], [['Result', 'Please provide a new prefix.']]));
      }

      if (newPrefix.length > 5) {
        return message.channel.send(formatThreeBlock('Barro Prefix', [['Status', 'Error']], [['Result', 'Prefix must be 5 characters or less.']]));
      }

      const accountId = client.user.id;
      const oldPrefix = getUserPrefix(accountId, client.prefix);
      setUserPrefix(accountId, newPrefix);
      client.prefix = newPrefix;
      log(`Prefix for ${message.author.tag} changed from '${oldPrefix}' to '${newPrefix}'`, 'info');

      return message.channel.send(formatThreeBlock('Barro Prefix', [['Status', 'Success']], [['Old Prefix', oldPrefix], ['New Prefix', newPrefix]]));
    } catch (error) {
      log(`Error in prefix command: ${error.message}`, 'error');
      return message.channel.send(formatThreeBlock('Barro Prefix', [['Status', 'Error']], [['Result', `Failed to change prefix: ${error.message}`]]));
    }
  }
};

function style(text, colorCode) {
  return `\u001b[${colorCode}m${text}\u001b[0m`;
}

function formatAnsiBlock(lines) {
  return ['> ```ansi', ...lines.map(line => `> ${line}`), '> ```'].join('\n');
}
function formatAnsiBlocks(blocks) {
  const [firstBlock, ...remainingBlocks] = blocks;
  const output = ['> ```ansi', ...firstBlock.map(line => `> ${line}`)];
  remainingBlocks.forEach(block => output.push('> ``````ansi', ...block.map(line => `> ${line}`)));
  output.push('> ```');
  return output.join('\n');
}

function formatThreeBlock(title, block2Rows, block3Rows) {
  const clean = (value) => String(value).replace(/\u001b\[[0-9;]*m/g, '');
  const width = [...block2Rows, ...block3Rows].reduce((max, [label]) => Math.max(max, clean(label).length), 0);
  const renderRows = (rows) => rows.map(([label, value]) => {
    const left = clean(label).padEnd(width, ' ');
    return style(left, THEME.LABEL_COLOR) + style(' | ', THEME.DIVIDER_COLOR) + style(clean(value), THEME.ACCENT_COLOR);
  });
  return formatAnsiBlocks([[formatHeaderTitle(title)], renderRows(block2Rows), renderRows(block3Rows)]);
}