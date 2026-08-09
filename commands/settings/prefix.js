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
                return message.channel.send(
                    `> ❌ **Please provide a new prefix!**\n` +
                    `> **Usage:** \`${client.prefix}prefix <new_prefix>\`\n` +
                    `> **Current prefix:** \`${client.prefix}\`\n` +
                    `> **Note:** Prefix must be 1-2 characters long`
                );
            }

            const newPrefix = args[0];
            
            // Validate prefix length (max 2 characters)
            if (newPrefix.length > 2) {
                return message.channel.send(
                    `> ❌ **Invalid prefix length!**\n` +
                    `> Prefix must be maximum 2 characters long.\n` +
                    `> You provided: \`${newPrefix}\` (${newPrefix.length} characters)`
                );
            }
            
            // Validate prefix characters (basic validation)
            if (newPrefix.includes(' ') || newPrefix.includes('\n') || newPrefix.includes('\t')) {
                return message.channel.send(
                    `> ❌ **Invalid prefix characters!**\n` +
                    `> Prefix cannot contain spaces, newlines, or tabs.`
                );
            }

            const oldPrefix = client.prefix;
            
            // Check if prefix is the same
            if (newPrefix === oldPrefix) {
                return message.channel.send(
                    `> ℹ️ **Prefix is already set to:** \`${newPrefix}\``
                );
            }

            const statusMsg = await message.channel.send(
                `> 🔧 **Updating prefix from \`${oldPrefix}\` to \`${newPrefix}\`...**`
            );

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
            
            await statusMsg.edit(
                `> ✅ **Prefix successfully updated!**\n\n` +
                `> **Previous prefix:** \`${oldPrefix}\`\n` +
                `> **New prefix:** \`${newPrefix}\`\n\n` +
                `> **Example usage:**\n` +
                `> • \`${newPrefix}help\` - Show help\n` +
                `> • \`${newPrefix}ping\` - Check latency\n` +
                `> • \`${newPrefix}prefix <new_prefix>\` - Change prefix again\n\n` +
                `> The new prefix is now active and saved to config!`
            );
            
            log(`Prefix changed from '${oldPrefix}' to '${newPrefix}' by ${message.author.tag}`, 'info');
            
        } catch (error) {
            log(`Error changing prefix: ${error.message}`, 'error');
            await message.channel.send(
                `> ❌ **Error changing prefix!**\n` +
                `> **Error:** ${error.message}\n` +
                `> Please try again or check the config file manually.`
            );
        }
    }
};