import chalk from 'chalk';
import { log } from '../../utils/functions.js';

export default {
    name: 'help',
    description: 'Display help information for commands',
    aliases: ['commands', 'cmds', 'h'],
    usage: '[command name]',
    category: 'general',
    type: 'both', // Can be chosen from dm_only or server_only
    permissions: ['SendMessages'], // Permissions required to execute the command
    cooldown: 5,
    
    /**
     * Execute the help command
     * @param {Client} client - Discord.js client instance
     * @param {Message} message - The message object
     * @param {Array} args - Command arguments
     */
    execute: async (client, message, args) => {
        try {
            const { commands } = client;
            const prefix = client.prefix;

            if (!args.length) {
                const categories = new Set();
                commands.forEach(command => {
                    categories.add(command.category || 'general');
                });

                const sortedCategories = Array.from(categories).sort();
                const lines = [
                    style('═════════ BARRO HELP ═════════', '0;30'),
                    '',
                    style(`PREFIX: ${prefix}`, '0;31'),
                    '',
                    style('AVAILABLE CATEGORIES:', '1;31')
                ];

                const categoryRows = formatCommandRows(sortedCategories.map(category => category.charAt(0).toUpperCase() + category.slice(1)), 2);
                categoryRows.forEach(row => lines.push(style(`  ${row}`, '0;97')));

                lines.push(
                    '',
                    style('USAGE:', '1;31'),
                    style(`  ${prefix}help <category>`, '0;97'),
                    style(`  ${prefix}help ${prefix}<command>`, '0;97')
                );
                return message.channel.send(formatAnsiBlock(lines));
            }

            const firstArg = args[0].toLowerCase();
            if (firstArg.startsWith(prefix)) {
                const commandName = firstArg.slice(prefix.length);
                const command = commands.get(commandName) ||
                    [...commands.values()].find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

                if (!command) {
                    return message.channel.send(formatAnsiBlock([style(`ERROR: No command found with name or alias '${commandName}'`, '1;91')]));
                }

                const lines = [
                    style('═════════ COMMAND INFO ═════════', '0;30'),
                    '',
                    style('COMMAND:', '1;31') + ' ' + style(command.name, '0;97'),
                    ''
                ];

                if (command.description) lines.push(style('DESCRIPTION:', '1;31') + ' ' + style(command.description, '0;97'));
                if (command.aliases && command.aliases.length) lines.push(style('ALIASES:', '1;31') + ' ' + style(command.aliases.join(', '), '0;97'));
                if (command.usage) lines.push(style('USAGE:', '1;31') + ' ' + style(`${prefix}${command.name} ${command.usage}`, '0;97'));
                if (command.category) lines.push(style('CATEGORY:', '1;31') + ' ' + style(command.category.charAt(0).toUpperCase() + command.category.slice(1), '0;97'));
                lines.push(style('COOLDOWN:', '1;31') + ' ' + style(`${command.cooldown || 3}s`, '0;97'));

                message.channel.send(formatAnsiBlock(lines));
                log(`${message.author.tag} used help command for '${commandName}'`, 'debug');
                return;
            }

            const categoryName = firstArg;
            const categoryCommands = [];
            commands.forEach(command => {
                if ((command.category || 'general').toLowerCase() === categoryName) {
                    categoryCommands.push(command.name);
                }
            });

            if (!categoryCommands.length) {
                return message.channel.send(formatAnsiBlock([style(`ERROR: No category found with name '${categoryName}'`, '1;91')]));
            }

            categoryCommands.sort();
            const displayCategoryName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
            const lines = [
                    style(`═════════ ${displayCategoryName.toUpperCase()} COMMANDS ═════════`, '0;30'),
                    ''
                ];
            const commandRows = formatCommandRows(categoryCommands, 2);
            commandRows.forEach(row => lines.push(style(`  ${row}`, '0;97')));
            lines.push(
                '',
                style('USAGE:', '1;31'),
                style(`  ${prefix}help ${prefix}<command>`, '0;97')
            );

            message.channel.send(formatAnsiBlock(lines));
            log(`${message.author.tag} used help command for category '${categoryName}'`, 'debug');
        } catch (error) {
            console.error(chalk.red('[ERROR] Error in help command:'), error);
            message.channel.send(formatAnsiBlock([style('ERROR: An error occurred while displaying help.', '1;91')]));
        }
    }
};

function style(text, colorCode) {
    return `\u001b[${colorCode}m${text}\u001b[0m`;
}

function formatCommandRows(commands, perRow = 2) {
    const maxLength = commands.reduce((max, cmd) => Math.max(max, cmd.length), 0);
    const rows = [];
    for (let i = 0; i < commands.length; i += perRow) {
        const rowItems = commands.slice(i, i + perRow).map((item, index) => {
            if (index === perRow - 1 || index === commands.slice(i, i + perRow).length - 1) {
                return item;
            }
            return item.padEnd(maxLength, ' ');
        });
        rows.push(rowItems.join(' | '));
    }
    return rows;
}

function formatAnsiBlock(lines) {
    return ['> ```ansi', ...lines.map(line => `> ${line}`), '> ```'].join('\n');
}
