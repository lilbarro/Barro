<<<<<<< HEAD
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
=======
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { fileURLToPath } from 'url';
import { log, loadConfig } from '../../utils/functions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    name: 'prefix',
    description: 'Change the selfbot prefix',
    aliases: ['setprefix', 'changeprefix'],
    usage: 'prefix <new_prefix>',
    category: 'settings',
    type: 'both',
    ownerOnly: true,
    permissions: ['SendMessages'],
    cooldown: 5,

    async execute(client, message, args) {
        try {
            if (!args.length) {
                return message.channel.send(formatAnsiBlock([
                    style(`ERROR: No prefix provided`, `1;94`),
                    style(`Usage: `, '0;97') + style(`${client.prefix}prefix <new_prefix>`, '0;34'),
                    style(`Current: `, '0;97') + style(client.prefix, '0;34')
                ]));
            }

            const newPrefix = args[0];
            
            // Validate prefix length (max 2 characters)
            if (newPrefix.length > 2) {
                return message.channel.send(formatAnsiBlock([
                    style(`ERROR: Invalid prefix length`, `1;94`),
                    style(`Maximum length is 2 characters.`, '0;34')
                ]));
            }
            
            // Validate prefix characters (basic validation)
            if (newPrefix.includes(' ') || newPrefix.includes('\n') || newPrefix.includes('\t')) {
                return message.channel.send(formatAnsiBlock([
                    style(`ERROR: Invalid prefix characters`, `1;94`),
                    style(`Spaces/newlines are not allowed.`, '0;34')
                ]));
            }

            const oldPrefix = client.prefix;
            
            // Check if prefix is the same
            if (newPrefix === oldPrefix) {
                return message.channel.send(formatAnsiBlock([
                    style(`INFO: Prefix is already set to '${newPrefix}'`, '0;34')
                ]));
            }

            const statusMsg = await message.channel.send(formatAnsiBlock([
                style(`Barro`, `4;30`) + style(` Prefix | Updating...`, '0;34'),
                style(`${oldPrefix} -> ${newPrefix}`, '0;30')
            ]));

            // Update client prefix
            client.prefix = newPrefix;
            
            // Load current config
            const config = loadConfig(true); // Force reload
            
            // Update config
            config.selfbot.prefix = newPrefix;
            
            // Save config to file
            const configPath = path.join(__dirname, '..', '..', 'config.yaml');
            const yamlStr = yaml.dump(config, {
                indent: 2,
                quotingType: '"',
                forceQuotes: false
            });
            
            fs.writeFileSync(configPath, yamlStr, 'utf8');
            
            const block1 = formatAnsiBlock([
                style(`Barro`, `4;30`) + style(` Prefix Updated`, '0;32')
            ]);

            const block2 = formatAnsiBlock([
                style('Summary', '4;30'),
                kv('Old Prefix', oldPrefix, 12),
                kv('New Prefix', newPrefix, 12)
            ]);

            const block3 = formatAnsiBlock([
                style('Usage Examples', '4;30'),
                style(`${newPrefix}help`, '0;34'),
                style(`${newPrefix}ping`, '0;34')
            ]);

            await statusMsg.edit([block1, block2, block3].join('\n'));
            
            log(`Prefix changed from '${oldPrefix}' to '${newPrefix}' by ${message.author.tag}`, 'info');
            
        } catch (error) {
            log(`Error changing prefix: ${error.message}`, 'error');
            await message.channel.send(formatAnsiBlock([
                style(`ERROR: Failed to update prefix`, `1;94`),
                style(error.message, '0;34')
            ]));
        }
    }
};

function style(text, colorCode) {
    return `\u001b[${colorCode}m${text}\u001b[0m`;
}

function formatAnsiBlock(lines) {
    return ['> ```ansi', ...lines.map(line => `> ${line}`), '> ```'].join('\n');
}

function kv(label, value, padTo) {
    const padded = String(label).padEnd(padTo, ' ');
    return style(padded, '0;97') + style(' | ', '0;30') + style(String(value), '0;34');
>>>>>>> origin/main
}