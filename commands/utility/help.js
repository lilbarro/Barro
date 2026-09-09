import chalk from 'chalk';
import { log, style, formatAnsiBlocks } from '../../utils/functions.js';
import { THEME } from '../../utils/theme.js';

export default {
    name: 'help',
    description: 'Display command help menus',
    aliases: ['commands', 'cmds', 'h'],
    usage: '[command name]',
    category: 'general',
    type: 'both',
    permissions: ['SendMessages'],
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

            const isPageNumber = args.length === 1 && /^\d+$/.test(args[0]);
            if (!args.length || isPageNumber) {
                let page = 1;
                if (isPageNumber) {
                    page = parseInt(args[0]);
                }

                const categories = new Set();
                commands.forEach(command => {
                    categories.add((command.category || 'general').toLowerCase());
                });

                const sortedCategories = Array.from(categories).sort();
                const categoryDescriptions = {
<<<<<<< HEAD:commands/general/help.js
                    ai: 'AI featured commands',
                    main: 'Exclusive commands',
                    utility: 'Utility commands',
                    other: 'Other commands',
                    theme: 'Theme commands',
                    relationships: 'Relationship lists',
                    general: 'General commands',
                    fun: 'Fun commands',
                    media: 'Media commands',
                    misc: 'Misc commands',
                    moderation: 'Moderation commands',
                    nsfw: 'Adult commands',
                    server: 'Server commands',
                    settings: 'Settings commands',
                    status: 'Status commands',
                    tracking: 'Tracking commands',
                    tools: 'Special tools'
                };

                const categoriesPerPage = 5;
                const totalPages = Math.max(1, Math.ceil(sortedCategories.length / categoriesPerPage));
                const safePage = Math.min(Math.max(page, 1), totalPages);
                const startIndex = (safePage - 1) * categoriesPerPage;
                const filteredCategories = sortedCategories.slice(startIndex, startIndex + categoriesPerPage);

                const block1Lines = [
                    style('Barro', THEME.HEADER_BOLD_COLOR) + style(` Help Menu (Page ${safePage}/${totalPages})`, THEME.ACCENT_COLOR)
                ];
=======
                    ai: 'AI assistance commands',
                    fun: 'Fun & entertainment commands',
                    general: 'General & config commands',
                    main: 'Hacking & useful commands',
                    media: 'Media & image commands',
                    misc: 'Utility & misc commands',
                    moderation: 'Moderation & server safety',
                    nsfw: 'NSFW commands',
                    server: 'Server management commands',
                    settings: 'Settings & configuration',
                    status: 'Status & statistics',
                    tracking: 'Message tracking commands',
                    utility: 'Utility commands',
                    tools: 'Hacking tools'
                };

                const page1Keys = ['ai', 'main', 'utility', 'misc'];
                const filteredCategories = page === 1
                    ? sortedCategories.filter(cat => page1Keys.includes(cat))
                    : sortedCategories.filter(cat => !page1Keys.includes(cat));

                const block1 = formatAnsiBlock([
                    style(`Barro v1.5` , `4;30`) + style(` Help Menu (Page ${page}/2)`, '0;34')
                ]);
>>>>>>> origin/main:commands/utility/help.js

                const categoryRows = filteredCategories.map(category => {
                    let displayName = category;
                    if (category === 'ai') displayName = 'AI';
                    else if (category === 'nsfw') displayName = 'NSFW';
                    else displayName = category.charAt(0).toUpperCase() + category.slice(1);

                    const description = categoryDescriptions[category] || `${displayName} commands`;
                    return { displayName, description };
                });

                const maxNameLength = categoryRows.reduce((max, cat) => Math.max(max, cat.displayName.length), 0);

<<<<<<< HEAD:commands/general/help.js
                const block2Lines = [style('Categories', THEME.HEADER_BOLD_COLOR)];
                categoryRows.forEach(cat => {
                    const paddedName = cat.displayName.padEnd(maxNameLength, ' ');
                    block2Lines.push(
                        style(paddedName, THEME.LABEL_COLOR) + style(' | ', THEME.DIVIDER_COLOR) + style(cat.description, THEME.ACCENT_COLOR)
=======
                const block2Lines = [style('Categories', '4;30')];
                categoryRows.forEach(cat => {
                    const paddedName = cat.displayName.padEnd(maxNameLength, ' ');
                    block2Lines.push(
                        style(paddedName, '0;97') + style(' | ', '0;30') + style(cat.description, '0;34')
>>>>>>> origin/main:commands/utility/help.js
                    );
                });

<<<<<<< HEAD:commands/general/help.js
                const block3Lines = [
                    style('Usage', THEME.HEADER_BOLD_COLOR),
                    style('Category:', THEME.LABEL_COLOR) + ` ` + style(`${prefix}help <category> [page]`, THEME.ACCENT_COLOR),
                    style('Commands:', THEME.LABEL_COLOR) + ` ` + style(`${prefix}help <command>`, THEME.ACCENT_COLOR)
                ];
=======
                const block3 = formatAnsiBlock([
                    style('Usage', '4;30'),
                    style('Category:', '0;97') + ` ` + style(`${prefix}help <category> [page]`, '0;34'),
                    style('Commands:', '0;97') + ` ` + style(`${prefix}help <command>`, '0;34')
                ]);
>>>>>>> origin/main:commands/utility/help.js

                return await message.channel.send(formatAnsiBlocks([
                    block1Lines,
                    block2Lines,
                    block3Lines
                ]));
            }

            const firstArg = args[0].toLowerCase();
            if (firstArg.startsWith(prefix)) {
                const commandName = firstArg.slice(prefix.length);
                const command = commands.get(commandName) ||
                    [...commands.values()].find(cmd =>
                        cmd.name?.toLowerCase() === commandName || (cmd.aliases && cmd.aliases.includes(commandName))
                    );

                if (!command) {
<<<<<<< HEAD:commands/general/help.js
                    return await message.channel.send(formatAnsiBlock([
                        style(`ERROR: No command found with name or alias '${commandName}'`, THEME.ACCENT_COLOR)
=======
                    return message.channel.send(formatAnsiBlock([
                        style(`ERROR: No command found with name or alias '${commandName}'`, '1;94')
>>>>>>> origin/main:commands/utility/help.js
                    ]));
                }

                const lines = [
<<<<<<< HEAD:commands/general/help.js
                    style('COMMAND INFO', THEME.DIVIDER_COLOR),
                    style('COMMAND:', THEME.LABEL_COLOR) + ' ' + style(command.name, THEME.ACCENT_COLOR)
                ];

                if (command.description) {
                    lines.push(style('DESCRIPTION:', THEME.LABEL_COLOR) + ' ' + style(compactWords(command.description), THEME.ACCENT_COLOR));
                }
=======
                    style('COMMAND INFO', '0;30'),
                    style('COMMAND:', '0;30') + ' ' + style(command.name, '0;34')
                ];

                if (command.description) {
                    lines.push(style('DESCRIPTION:', '0;30') + ' ' + style(command.description, '0;34'));
                }

                if (command.aliases && command.aliases.length) {
                    lines.push(style('ALIASES:', '0;30') + ' ' + style(command.aliases.join(', '), '0;34'));
                }

                if (command.usage) {
                    lines.push(style('USAGE:', '0;30') + ' ' + style(`${prefix}${command.name} ${command.usage}`, '0;34'));
                }

                if (command.category) {
                    lines.push(
                        style('CATEGORY:', '1;97') + ' ' +
                        style(command.category.charAt(0).toUpperCase() + command.category.slice(1), '0;34')
                    );
                }

                lines.push(style('COOLDOWN:', '0;30') + ' ' + style(`${command.cooldown || 3}s`, '0;34'));
>>>>>>> origin/main:commands/utility/help.js

                if (command.aliases && command.aliases.length) {
                    lines.push(style('ALIASES:', THEME.LABEL_COLOR) + ' ' + style(command.aliases.join(', '), THEME.ACCENT_COLOR));
                }

                if (command.usage) {
                    lines.push(style('USAGE:', THEME.LABEL_COLOR) + ' ' + style(`${prefix}${command.name} ${command.usage}`, THEME.ACCENT_COLOR));
                }

                if (command.category) {
                    lines.push(
                        style('CATEGORY:', THEME.LABEL_COLOR) + ' ' +
                        style(command.category.charAt(0).toUpperCase() + command.category.slice(1), THEME.ACCENT_COLOR)
                    );
                }

                lines.push(style('COOLDOWN:', THEME.LABEL_COLOR) + ' ' + style(`${command.cooldown || 3}s`, THEME.ACCENT_COLOR));

                await message.channel.send(formatAnsiBlock(lines));
                log(`${message.author.tag} used help command for '${commandName}'`, 'debug');
                return;
            }

            const categoryArg = firstArg;
            const pageArg = args[1];
            const page = pageArg ? parseInt(pageArg) || 1 : 1;

            const categoryCommands = [];
            commands.forEach(command => {
                if ((command.category || 'general').toLowerCase() === categoryArg) {
                    categoryCommands.push(command);
                }
            });

            if (!categoryCommands.length) {
<<<<<<< HEAD:commands/general/help.js
                return await message.channel.send(formatAnsiBlock([
                    style(`ERROR: No category found with name '${categoryArg}'`, THEME.ACCENT_COLOR)
                ]));
            }

            categoryCommands.sort((a, b) => a.name.localeCompare(b.name));
=======
                return message.channel.send(formatAnsiBlock([
                    style(`ERROR: No category found with name '${categoryName}'`, '0;94')
                ]));
            }

            categoryCommands.sort();
            const displayCategoryName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
            const lines = [
                style(`${displayCategoryName.toUpperCase()} COMMANDS`, '0;30')
            ];

            const commandRows = formatCommandRows(categoryCommands, 2);
            commandRows.forEach(row => lines.push(style(row, '0;34')));
            lines.push(
                style('USAGE:', '0;30'),
                style(`  ${prefix}help ${prefix}<command>`, '0;34')
            );
>>>>>>> origin/main:commands/utility/help.js

            const commandsPerPage = 6;
            const totalPages = Math.ceil(categoryCommands.length / commandsPerPage);
            const startIdx = (page - 1) * commandsPerPage;
            const pageCommands = categoryCommands.slice(startIdx, startIdx + commandsPerPage);

            if (page > totalPages || page < 1) {
                return await message.channel.send(formatAnsiBlock([
                    style(`ERROR: Page ${page} not found. Valid range: 1-${totalPages}`, THEME.ACCENT_COLOR)
                ]));
            }

            const displayCategoryName = categoryArg.charAt(0).toUpperCase() + categoryArg.slice(1);
            const block1 = formatAnsiBlock([
                style('Barro', THEME.HEADER_BOLD_COLOR) + style(` ${displayCategoryName} commands (Page ${page}/${totalPages})`, THEME.ACCENT_COLOR)
            ]);

            const block2Lines = [style('Commands', THEME.HEADER_BOLD_COLOR)];

            // Calculate max name length for padding
            const maxNameLength = Math.max(...pageCommands.map(c => c.name.length));

            pageCommands.forEach(cmd => {
                const paddedName = cmd.name.padEnd(maxNameLength, ' ');
                const description = compactWords(cmd.description || 'No description');
                block2Lines.push(
                    style(paddedName, THEME.LABEL_COLOR) + style(' | ', THEME.DIVIDER_COLOR) + style(description, THEME.ACCENT_COLOR)
                );
            });
            const block2 = formatAnsiBlock(block2Lines);

            const block3 = formatAnsiBlock([
                style('Usage', THEME.HEADER_BOLD_COLOR),
                style('Category:', THEME.LABEL_COLOR) + ` ` + style(`${prefix}help <category> [page]`, THEME.ACCENT_COLOR),
                style('Commands:', THEME.LABEL_COLOR) + ` ` + style(`${prefix}help <command>`, THEME.ACCENT_COLOR)
            ]);

            await message.channel.send(formatAnsiBlocks([block1, block2, block3]));
            log(`${message.author.tag} used help command for category '${categoryArg}'`, 'debug');
        } catch (error) {
            console.error(chalk.red('[ERROR] Error in help command:'), error);
            message.channel.send(formatAnsiBlock([
<<<<<<< HEAD:commands/general/help.js
                style('ERROR: An error occurred while displaying help.', THEME.ACCENT_COLOR)
=======
                style('ERROR: An error occurred while displaying help.', '0;94')
>>>>>>> origin/main:commands/utility/help.js
            ]));
        }
    }
};

<<<<<<< HEAD:commands/general/help.js
=======
function style(text, colorCode) {
    return `\u001b[${colorCode}m${text}\u001b[0m`;
}

function formatCommandRows(commands, perRow = 2) {
    const maxLength = commands.reduce((max, cmd) => Math.max(max, cmd.length), 0);
    const rows = [];

    for (let i = 0; i < commands.length; i += perRow) {
        const chunk = commands.slice(i, i + perRow);
        const rowItems = chunk.map((item, index) => {
            if (index === chunk.length - 1) {
                return item;
            }
            return item.padEnd(maxLength, ' ');
        });
        rows.push(rowItems.join(' | '));
    }

    return rows;
}
>>>>>>> origin/main:commands/utility/help.js

function formatAnsiBlock(lines) {
    return ['> ```ansi', ...lines.map(line => `> ${line}`), '> ```'].join('\n');
}

function compactWords(value) {
    const words = String(value).replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
    if (words.length <= 4) return words.join(' ');
    return `${words.slice(0, 4).join(' ')}...`;
}


