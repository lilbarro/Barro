import { saveAllowedUsers, loadAllowedUsers, formatAnsiBlocks } from "../../utils/functions.js";
import { formatHeaderTitle } from "../../utils/functions.js";
import { HEADER } from "../../data/header.js";
import { THEME } from "../../utils/theme.js";

// ============================================
// VISUAL FORMATTING HELPERS (ANSI THEME)
// ============================================

function style(text, colorCode, underlined = false) {
	if (String(text).startsWith('Barro') && colorCode === THEME.HEADER_BOLD_COLOR) {
		const suffix = String(text).slice(HEADER.BRAND.length).replace(/^\s*v\d+(?:\.\d+)*\b/, '');
		return `\x1b[${THEME.HEADER_BOLD_COLOR}m${HEADER.BRAND}\x1b[0m ` + `\x1b[${THEME.HEADER_BOLD_COLOR}m${HEADER.VERSION}\x1b[0m` + `\x1b[${THEME.ACCENT_COLOR}m${suffix}\x1b[0m`;
	}
	const underline = underlined ? '\x1b[4m' : '';
	return `${underline}\x1b[${colorCode}m${text}\x1b[0m`;
}

function formatAnsiBlock(lines) {
	return ['> ```ansi', ...lines.map(line => `> ${line}`), '> ```'].join('\n');
}

export default {
	name: "unwhitelist",
	aliases: ["removewl", "unwl"],
	category: "utility",
	ownerOnly: true,
	description: "Remove user from whitelist",
	async execute(client, message, args) {
		const block1 = formatAnsiBlock([
			formatHeaderTitle('Barro Unwhitelist Menu')
		]);

		if (!args[0]) {
			const info = formatAnsiBlock([
				style('Usage', THEME.HEADER_BOLD_COLOR, true),
				style('Command:', THEME.LABEL_COLOR) + ' ' + style('unwhitelist <UserID/Mention>', THEME.ACCENT_COLOR),
				style('Action:', THEME.LABEL_COLOR) + ' ' + style('Removes a user from the allowed list', THEME.ACCENT_COLOR),
				style('Result:', THEME.LABEL_COLOR) + ' ' + style('Revokes access to the bot', THEME.ACCENT_COLOR)
			]);
			return message.channel.send(formatAnsiBlocks([block1, info]));
		}

		let userId;
		if (message.mentions.users.size > 0) {
			userId = message.mentions.users.first().id;
		} else if (/^\d{17,19}$/.test(args[0])) {
			userId = args[0];
		} else if (message.guild) {
			const username = args.join(" ").toLowerCase();
			const member = message.guild.members.cache.find(m =>
				m.user.username.toLowerCase() === username ||
				m.displayName.toLowerCase() === username ||
				m.user.tag.toLowerCase() === username
			);
			if (member) userId = member.id;
		}

		if (!userId) {
			const err = formatAnsiBlock([
				style('Unwhitelist Error', THEME.HEADER_BOLD_COLOR, true),
				style('Result:', THEME.LABEL_COLOR) + ' ' + style('Could not find that user. Use a mention or ID.', THEME.ACCENT_COLOR)
			]);
			return message.channel.send(formatAnsiBlocks([block1, err]));
		}

		try {
			const accountId = client.user.id;
			let allowedUsers = loadAllowedUsers(accountId);

			if (!allowedUsers.includes(userId)) {
				const warn = formatAnsiBlock([
					style('Unwhitelist Warning', THEME.HEADER_BOLD_COLOR, true),
					style('Status:', THEME.LABEL_COLOR) + ' ' + style('User not whitelisted', THEME.ACCENT_COLOR),
					style('User:', THEME.LABEL_COLOR) + ' ' + style(`<@${userId}>`, THEME.ACCENT_COLOR)
				]);
				return message.channel.send(formatAnsiBlocks([block1, warn]));
			}

			const updatedUsers = allowedUsers.filter(id => id !== userId);
			saveAllowedUsers(accountId, updatedUsers);

			const success = formatAnsiBlock([
				style('Unwhitelist Success', THEME.HEADER_BOLD_COLOR, true),
				style('User:', THEME.LABEL_COLOR) + ' ' + style(`<@${userId}>`, THEME.ACCENT_COLOR),
				style('Result:', THEME.LABEL_COLOR) + ' ' + style('Access has been revoked', THEME.ACCENT_COLOR)
			]);
			return message.channel.send(formatAnsiBlocks([block1, success]));
		} catch (error) {
			const err = formatAnsiBlock([
				style('Unwhitelist Error', THEME.HEADER_BOLD_COLOR, true),
				style('Result:', THEME.LABEL_COLOR) + ' ' + style(error.message, THEME.ACCENT_COLOR)
			]);
			return message.channel.send(formatAnsiBlocks([block1, err]));
		}
	},
};
