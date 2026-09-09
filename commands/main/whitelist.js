import { loadAllowedUsers, saveAllowedUsers, style, formatAnsiBlock, formatAnsiBlocks } from "../../utils/functions.js";
import { THEME } from "../../utils/theme.js";

export default {
    name: "whitelist",
    aliases: ["wl"],
    category: "main",
    description: "Manage bot whitelist",
    ownerOnly: true,
    async execute(client, message, args) {
        const accountId = client.user.id;
        const prefix = client.prefix;
        const block1 = formatAnsiBlock([
            style('Barro v2', THEME.HEADER_BOLD_COLOR) + style(' Whitelist Manager', THEME.ACCENT_COLOR)
        ]);

        const usageRows = [
            [`${prefix}wl add @user`, 'Allow a user to use the bot'],
            [`${prefix}wl remove @user`, 'Remove a user from the whitelist'],
            [`${prefix}wl list`, 'List all whitelisted users'],
            [`${prefix}wl clear`, 'Remove everyone from the whitelist']
        ];
        const maxUsageLength = Math.max(...usageRows.map(([command]) => command.length));
        const usageBlock = formatAnsiBlock([
            style('Whitelist Help Menu', THEME.HEADER_BOLD_COLOR),
            ...usageRows.map(([command, description]) =>
                style(command.padEnd(maxUsageLength, ' '), THEME.LABEL_COLOR) + style(' | ', THEME.DIVIDER_COLOR) + style(description, THEME.ACCENT_COLOR)
            )
        ]);

        const errorResponse = (result) => formatAnsiBlocks([
            block1,
            formatAnsiBlock([
                style('Error', THEME.LABEL_COLOR) + style(' | ', THEME.DIVIDER_COLOR) + style(result, THEME.ACCENT_COLOR)
            ]),
            usageBlock
        ]);

        const subcommand = args[0]?.toLowerCase();

        if (!subcommand) {
            return message.channel.send(formatAnsiBlocks([block1, usageBlock]));
        }

        let allowedUsers = loadAllowedUsers(accountId);

        if (subcommand === "add") {
            let userId = args[1];
            if (!userId) return message.channel.send(errorResponse('Please provide a User ID or mention the user'));

            if (userId.startsWith('<@')) {
                userId = userId.replace(/[<@!>]/g, '');
            }

            if (allowedUsers.includes(userId)) {
                return message.channel.send(formatAnsiBlocks([block1, formatAnsiBlock([style('Info', THEME.HEADER_BOLD_COLOR), style('Result', THEME.LABEL_COLOR) + style(' | ', THEME.DIVIDER_COLOR) + style('User is already whitelisted', THEME.ACCENT_COLOR)])]));
            }

            allowedUsers.push(userId);
            saveAllowedUsers(accountId, allowedUsers);

            return message.channel.send(formatAnsiBlocks([block1, formatAnsiBlock([style('Success', THEME.HEADER_BOLD_COLOR), style('Result', THEME.LABEL_COLOR) + style(' | ', THEME.DIVIDER_COLOR) + style(`User ${userId} has been whitelisted`, THEME.ACCENT_COLOR)])]));
        }

        if (subcommand === "remove") {
            let userId = args[1];
            if (!userId) return message.channel.send(errorResponse('Please provide a User ID or mention the user'));

            if (userId.startsWith('<@')) {
                userId = userId.replace(/[<@!>]/g, '');
            }

            if (!allowedUsers.includes(userId)) {
                return message.channel.send(formatAnsiBlocks([block1, formatAnsiBlock([style('Error', THEME.HEADER_BOLD_COLOR), style('Result', THEME.LABEL_COLOR) + style(' | ', THEME.DIVIDER_COLOR) + style('User is not in the whitelist', THEME.ACCENT_COLOR)])]));
            }

            allowedUsers = allowedUsers.filter(id => id !== userId);
            saveAllowedUsers(accountId, allowedUsers);

            return message.channel.send(formatAnsiBlocks([block1, formatAnsiBlock([style('Success', THEME.HEADER_BOLD_COLOR), style('Result', THEME.LABEL_COLOR) + style(' | ', THEME.DIVIDER_COLOR) + style(`User ${userId} has been removed`, THEME.ACCENT_COLOR)])]));
        }

        if (subcommand === "list") {
            if (allowedUsers.length === 0) {
                return message.channel.send(formatAnsiBlocks([block1, formatAnsiBlock([style('Whitelist', THEME.HEADER_BOLD_COLOR), style('Result', THEME.LABEL_COLOR) + style(' | ', THEME.DIVIDER_COLOR) + style('No users whitelisted', THEME.ACCENT_COLOR)])]));
            }

            const lines = [style('Whitelisted Users', THEME.HEADER_BOLD_COLOR)];
            allowedUsers.forEach((id, index) => {
                lines.push(style(`${index + 1}.`, THEME.LABEL_COLOR) + style(' ', THEME.DIVIDER_COLOR) + style(id, THEME.ACCENT_COLOR));
            });

            return message.channel.send(formatAnsiBlocks([block1, formatAnsiBlock(lines)]));
        }

        if (subcommand === "clear") {
            saveAllowedUsers(accountId, []);
            return message.channel.send(formatAnsiBlocks([block1, formatAnsiBlock([style('Success', THEME.HEADER_BOLD_COLOR), style('Result', THEME.LABEL_COLOR) + style(' | ', THEME.DIVIDER_COLOR) + style('Whitelist cleared!', THEME.ACCENT_COLOR)])]));
        }

        return message.channel.send(errorResponse('Please provide a User ID or mention the user'));
    }
};
