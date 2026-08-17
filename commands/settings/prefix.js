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
}