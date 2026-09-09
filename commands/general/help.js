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

                const categoryRows = filteredCategories.map(category => {
                    let displayName = category;
                    if (category === 'ai') displayName = 'AI';
                    else if (category === 'nsfw') displayName = 'NSFW';
                    else displayName = category.charAt(0).toUpperCase() + category.slice(1);

                    const description = categoryDescriptions[category] || `${displayName} commands`;
                    return { displayName, description };
                });

                const maxNameLength = categoryRows.reduce((max, cat) => Math.max(max, cat.displayName.length), 0);

                const block2Lines = [style('Categories', THEME.HEADER_BOLD_COLOR)];
                categoryRows.forEach(cat => {
                    const paddedName = cat.displayName.padEnd(maxNameLength, ' ');
                    block2Lines.push(
                        style(paddedName, THEME.LABEL_COLOR) + style(' | ', THEME.DIVIDER_COLOR) + style(cat.description, THEME.ACCENT_COLOR)
                    );
                });

                const block3Lines = [
                    style('Usage', THEME.HEADER_BOLD_COLOR),
                    style('Category:', THEME.LABEL_COLOR) + ` ` + style(`${prefix}help <category> [page]`, THEME.ACCENT_COLOR),
                    style('Commands:', THEME.LABEL_COLOR) + ` ` + style(`${prefix}help <command>`, THEME.ACCENT_COLOR)
                ];

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
                    return await message.channel.send(formatAnsiBlock([
                        style(`ERROR: No command found with name or alias '${commandName}'`, THEME.ACCENT_COLOR)
                    ]));
                }

                const lines = [
                    style('COMMAND INFO', THEME.DIVIDER_COLOR),
                    style('COMMAND:', THEME.LABEL_COLOR) + ' ' + style(command.name, THEME.ACCENT_COLOR)
                ];

                if (command.description) {
                    lines.push(style('DESCRIPTION:', THEME.LABEL_COLOR) + ' ' + style(compactWords(command.description), THEME.ACCENT_COLOR));
                }

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
                return await message.channel.send(formatAnsiBlock([
                    style(`ERROR: No category found with name '${categoryArg}'`, THEME.ACCENT_COLOR)
                ]));
            }

            categoryCommands.sort((a, b) => a.name.localeCompare(b.name));

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
                style('ERROR: An error occurred while displaying help.', THEME.ACCENT_COLOR)
            ]));
        }
    }
};


function formatAnsiBlock(lines) {
    return ['> ```ansi', ...lines.map(line => `> ${line}`), '> ```'].join('\n');
}

function compactWords(value) {
    const words = String(value).replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
    if (words.length <= 4) return words.join(' ');
    return `${words.slice(0, 4).join(' ')}...`;
}


