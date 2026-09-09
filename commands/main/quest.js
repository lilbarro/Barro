import { QuestManager } from "../../utils/questManager.js";
import { formatAnsiBlocks } from "../../utils/functions.js";
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
	name: "quest",
	category: "main",
	description: "Manage Discord quests",
	aliases: ["quests"],
	async execute(client, message, args) {
		const prefix = client.prefix;
		const token = client.token || client.user?.token || client.config?.selfbot?.token;
		if (!token) {
			const header = formatAnsiBlock([formatHeaderTitle('Barro Quest Completor')]);
			const info = formatAnsiBlock([
				style('Error', THEME.HEADER_BOLD_COLOR, true),
				style('Status:', THEME.LABEL_COLOR) + ' ' + style('Token Missing', THEME.ACCENT_COLOR),
				style('Result:', THEME.LABEL_COLOR) + ' ' + style('Login required', THEME.ACCENT_COLOR)
			]);
			return message.channel.send(formatAnsiBlocks([header, info]));
		}

		if (!client.questManager) {
			client.questManager = new QuestManager(token);
		}
		const manager = client.questManager;
		const subcommand = args[0]?.toLowerCase();

		// Header Block - Defined as a constant like help.js
		const block1 = formatAnsiBlock([
			formatHeaderTitle('Barro Quest Completor Menu')
		]);

		if (!subcommand) {
			const subcommands = [
				{ cmd: `${prefix}quest list`, desc: 'List all available quests' },
				{ cmd: `${prefix}quest complete`, desc: 'Complete a specific quest' },
				{ cmd: `${prefix}quest all`, desc: 'Complete all quests' },
				{ cmd: `${prefix}quest redeem`, desc: 'Redeem a quest' },
			];

			const maxCmdLength = Math.max(...subcommands.map(s => s.cmd.length));
			const subCommandLines = [style('Sub-commands', THEME.HEADER_BOLD_COLOR, true)];

			subcommands.forEach(s => {
				subCommandLines.push(
					style(s.cmd.padEnd(maxCmdLength, ' '), THEME.LABEL_COLOR) +
					style(' | ', THEME.DIVIDER_COLOR) +
					style(s.desc, THEME.ACCENT_COLOR)
				);
			});

			const block2 = formatAnsiBlock(subCommandLines);
			const block3 = formatAnsiBlock([
				style('Usage', THEME.HEADER_BOLD_COLOR, true),
				style('All quests:', THEME.LABEL_COLOR) + ' ' + style(`${prefix}quest all`, THEME.ACCENT_COLOR),
				style('Specific quest:', THEME.LABEL_COLOR) + ' ' + style(`${prefix}quest complete ID`, THEME.ACCENT_COLOR)
			]);
			return message.channel.send(formatAnsiBlocks([block1, block2, block3]));
		}

		try {
			if (subcommand === "stop") {
				const block2 = formatAnsiBlock([
					style('Quest Stop', THEME.HEADER_BOLD_COLOR, true),
					style('Status:', THEME.LABEL_COLOR) + ' ' + style('Stopping...', THEME.ACCENT_COLOR),
					style('Result:', THEME.LABEL_COLOR) + ' ' + style('Will finish current request and stop.', THEME.ACCENT_COLOR)
				]);
				return message.channel.send(formatAnsiBlocks([block1, block2]));
			}

			if (subcommand === "list") {
				try {
					const quests = await manager.fetchQuests();
					const filteredQuests = quests.filter(q => {
						const isCompleted = q.user_status?.completed_at || q.user_status?.claimed_at;
						const isExpired = manager.isQuestExpired(q);
						return !isCompleted && !isExpired;
					});

					if (!filteredQuests || filteredQuests.length === 0) {
						const block2 = formatAnsiBlock([
							style('Available Quest list', THEME.HEADER_BOLD_COLOR, true),
							style('Result:', THEME.LABEL_COLOR) + ' ' + style('No active quests found', THEME.ACCENT_COLOR)
						]);
						const block3 = formatAnsiBlock([
							style('Usage', THEME.HEADER_BOLD_COLOR, true),
							style('All quests:', THEME.LABEL_COLOR) + ' ' + style(`${prefix}quest all`, THEME.ACCENT_COLOR),
							style('Specific quest:', THEME.LABEL_COLOR) + ' ' + style(`${prefix}quest complete ID`, THEME.ACCENT_COLOR)
						]);
						return message.channel.send(formatAnsiBlocks([block1, block2, block3]));
					}

					const rows = filteredQuests.map(q => [
						q.id,
						q.config?.messages?.quest_name || "Unknown Quest"
					]);

					const maxIdLength = rows.reduce((max, [id]) => Math.max(max, String(id).length), 0);
					const listLines = [style('Available Quest list', THEME.HEADER_BOLD_COLOR, true)];
					rows.forEach(([id, name]) => {
						listLines.push(style(String(id).padEnd(maxIdLength, ' '), THEME.LABEL_COLOR) + style(' | ', THEME.DIVIDER_COLOR) + style(name, THEME.ACCENT_COLOR));
					});

					const block2 = formatAnsiBlock(listLines);
					const block3 = formatAnsiBlock([
						style('Usage', THEME.HEADER_BOLD_COLOR, true),
						style('All quest:', THEME.LABEL_COLOR) + ' ' + style(`${prefix}quest all`, THEME.ACCENT_COLOR),
						style('One quest:', THEME.LABEL_COLOR) + ' ' + style(`${prefix}quest complete (ID)`, THEME.ACCENT_COLOR)
					]);

					if (rows.length <= 10) {
						return message.channel.send(formatAnsiBlocks([block1, block2, block3]));
					}

					const chunks = [];
					for (let i = 0; i < rows.length; i += 10) {
						const chunkRows = rows.slice(i, i + 10);
						const chunkLines = [style('Available Quest list', THEME.HEADER_BOLD_COLOR, true)];
						chunkRows.forEach(([id, name]) => {
							chunkLines.push(style(String(id).padEnd(maxIdLength, ' '), THEME.LABEL_COLOR) + style(' | ', THEME.DIVIDER_COLOR) + style(name, THEME.ACCENT_COLOR));
						});
						chunks.push(formatAnsiBlock(chunkLines));
					}

					let currentMsg = block1;
					for (let i = 0; i < chunks.length; i++) {
						if ((currentMsg + '\n' + chunks[i]).length < 1900) {
							currentMsg += '\n' + chunks[i];
						} else {
							await message.channel.send(currentMsg);
							currentMsg = chunks[i];
						}
					}
					await message.channel.send(`${currentMsg}\n${block3}`);
					return;
				} catch (error) {
					const block2 = formatAnsiBlock([
						style('Quest Error', THEME.HEADER_BOLD_COLOR, true),
						style('Type:', THEME.LABEL_COLOR) + ' ' + style('Fetch Error', THEME.ACCENT_COLOR),
						style('Result:', THEME.LABEL_COLOR) + ' ' + style(error.message, THEME.ACCENT_COLOR)
					]);
					return message.channel.send(formatAnsiBlocks([block1, block2]));
				}
			}

			const findQuest = async (identifier) => {
				const quests = await manager.fetchQuests();
				const index = parseInt(identifier) - 1;
				if (!isNaN(index) && quests[index]) return quests[index];
				const byId = quests.find(q => q.id === identifier);
				if (byId) return byId;
				const byName = quests.find(q => (q.config?.messages?.quest_name || "").toLowerCase() === identifier.toLowerCase());
				if (byName) return byName;
				return null;
			};

			if (subcommand === "complete") {
				const identifier = args[1];
				if (!identifier) {
					const block3 = formatAnsiBlock([
						style('Usage', THEME.HEADER_BOLD_COLOR, true),
						style('All quests:', THEME.LABEL_COLOR) + ' ' + style(`${prefix}quest all`, THEME.ACCENT_COLOR),
						style('Specific quest:', THEME.LABEL_COLOR) + ' ' + style(`${prefix}quest complete ID`, THEME.ACCENT_COLOR)
					]);
					return message.channel.send(formatAnsiBlocks([block1, block3]));
				}

				const quest = await findQuest(identifier);
				if (!quest) {
					const block2 = formatAnsiBlock([
						style('Quest Error', THEME.HEADER_BOLD_COLOR, true),
						style('Input:', THEME.LABEL_COLOR) + ' ' + style('Invalid', THEME.ACCENT_COLOR),
						style('Result:', THEME.LABEL_COLOR) + ' ' + style('Quest not found', THEME.ACCENT_COLOR)
					]);
					return message.channel.send(formatAnsiBlocks([block1, block2]));
				}

				const questName = quest.config?.messages?.quest_name || 'Unknown Quest';
				const blockStart = formatAnsiBlock([
					style('Quest Complete', THEME.HEADER_BOLD_COLOR, true),
					style('Quest:', THEME.LABEL_COLOR) + ' ' + style(questName, THEME.ACCENT_COLOR),
					style('Status:', THEME.LABEL_COLOR) + ' ' + style('Attempting...', THEME.ACCENT_COLOR)
				]);
				await message.channel.send(formatAnsiBlocks([block1, blockStart]));
				await manager.doQuest(quest.id);
				const blockEnd = formatAnsiBlock([
					style('Quest Complete', THEME.HEADER_BOLD_COLOR, true),
					style('Quest:', THEME.LABEL_COLOR) + ' ' + style(questName, THEME.ACCENT_COLOR),
					style('Result:', THEME.LABEL_COLOR) + ' ' + style('Process finished!', THEME.ACCENT_COLOR)
				]);
				return message.channel.send(formatAnsiBlocks([block1, blockEnd]));
			}

			if (subcommand === "redeem") {
				const identifier = args[1];
				if (!identifier) {
					const block3 = formatAnsiBlock([
						style('Usage', THEME.HEADER_BOLD_COLOR, true),
						style('All quests:', THEME.LABEL_COLOR) + ' ' + style(`${prefix}quest all`, THEME.ACCENT_COLOR),
						style('Specific quest:', THEME.LABEL_COLOR) + ' ' + style(`${prefix}quest complete ID`, THEME.ACCENT_COLOR)
					]);
					return message.channel.send(formatAnsiBlocks([block1, block3]));
				}

				const quest = await findQuest(identifier);
				if (!quest) {
					const block2 = formatAnsiBlock([
						style('Quest Error', THEME.HEADER_BOLD_COLOR, true),
						style('Input:', THEME.LABEL_COLOR) + ' ' + style('Invalid', THEME.ACCENT_COLOR),
						style('Result:', THEME.LABEL_COLOR) + ' ' + style('Quest not found', THEME.ACCENT_COLOR)
					]);
					return message.channel.send(formatAnsiBlocks([block1, block2]));
				}

				const questName = quest.config?.messages?.quest_name || 'Unknown Quest';
				const blockStart = formatAnsiBlock([
					style('Quest Redeem', THEME.HEADER_BOLD_COLOR, true),
					style('Quest:', THEME.LABEL_COLOR) + ' ' + style(questName, THEME.ACCENT_COLOR),
					style('Status:', THEME.LABEL_COLOR) + ' ' + style('Attempting...', THEME.ACCENT_COLOR)
				]);
				await message.channel.send(formatAnsiBlocks([block1, blockStart]));
				await manager.redeemQuest(quest.id);
				const blockEnd = formatAnsiBlock([
					style('Quest Redeem', THEME.HEADER_BOLD_COLOR, true),
					style('Quest:', THEME.LABEL_COLOR) + ' ' + style(questName, THEME.ACCENT_COLOR),
					style('Result:', THEME.LABEL_COLOR) + ' ' + style('Successfully redeemed!', THEME.ACCENT_COLOR)
				]);
				return message.channel.send(formatAnsiBlocks([block1, blockEnd]));
			}

			if (subcommand === "all") {
				manager.stopRequested = false;
				const blockStart = formatAnsiBlock([
					style('Quest All', THEME.HEADER_BOLD_COLOR, true),
					style('Action:', THEME.LABEL_COLOR) + ' ' + style('Completing all available', THEME.ACCENT_COLOR),
					style('Status:', THEME.LABEL_COLOR) + ' ' + style('Processing in batches to avoid rate limits...', THEME.ACCENT_COLOR)
				]);
				await message.channel.send(formatAnsiBlocks([block1, blockStart]));
				const allQuests = await manager.fetchQuests();

				const availableQuests = allQuests.filter(q => {
					const isCompleted = q.user_status?.completed_at || q.user_status?.claimed_at;
					const isExpired = manager.isQuestExpired(q);
					return !isCompleted && !isExpired;
				});

				if (availableQuests.length === 0) {
					const block2 = formatAnsiBlock([
						style('Quest All', THEME.HEADER_BOLD_COLOR, true),
						style('Result:', THEME.LABEL_COLOR) + ' ' + style('No available quests', THEME.ACCENT_COLOR)
					]);
					return message.channel.send(formatAnsiBlocks([block1, block2]));
				}

				let completedCount = 0;
				let failedCount = 0;

				const batchSize = 7;
				for (let i = 0; i < availableQuests.length; i += batchSize) {
					const batch = availableQuests.slice(i, i + batchSize);
					const batchPromises = batch.map(async (q, index) => {
						try {
							await new Promise(r => setTimeout(r, index * 500));
							await manager.doQuest(q.id);
							completedCount++;
						} catch (e) {
							failedCount++;
							const qName = q.config?.messages?.quest_name || 'Unknown Quest';
							const blockErr = formatAnsiBlock([
								style('Quest Error', THEME.HEADER_BOLD_COLOR, true),
								style('Quest:', THEME.LABEL_COLOR) + ' ' + style(qName, THEME.ACCENT_COLOR),
								style('Result:', THEME.LABEL_COLOR) + ' ' + style(e.message, THEME.ACCENT_COLOR)
							]);
							await message.channel.send(formatAnsiBlocks([block1, blockErr]));
						}
					});
					await Promise.all(batchPromises);
				}

				if (manager.stopRequested) {
					const blockEnd = formatAnsiBlock([
						style('Quest All', THEME.HEADER_BOLD_COLOR, true),
						style('Status:', THEME.LABEL_COLOR) + ' ' + style('Stopped', THEME.ACCENT_COLOR),
						style('Completed:', THEME.LABEL_COLOR) + ' ' + style(String(completedCount), THEME.ACCENT_COLOR)
					]);
					return message.channel.send(formatAnsiBlocks([block1, blockEnd]));
				}

				const blockEnd = formatAnsiBlock([
					style('Quest All', THEME.HEADER_BOLD_COLOR, true),
					style('Completed:', THEME.LABEL_COLOR) + ' ' + style(String(completedCount), THEME.ACCENT_COLOR),
					style('Failed:', THEME.LABEL_COLOR) + ' ' + style(String(failedCount), THEME.ACCENT_COLOR)
				]);
				return message.channel.send(formatAnsiBlocks([block1, blockEnd]));
			}

			const block3 = formatAnsiBlock([
				style('Usage', THEME.HEADER_BOLD_COLOR, true),
				style('All quests:', THEME.LABEL_COLOR) + ' ' + style(`${prefix}quest all`, THEME.ACCENT_COLOR),
				style('Specific quest:', THEME.LABEL_COLOR) + ' ' + style(`${prefix}quest complete ID`, THEME.ACCENT_COLOR)
			]);
			return message.channel.send(formatAnsiBlocks([block1, block3]));
		} catch (error) {
			console.error(`Quest Command Error: ${error.message}`);
			const block2 = formatAnsiBlock([
				style('Quest Error', THEME.HEADER_BOLD_COLOR, true),
				style('Status:', THEME.LABEL_COLOR) + ' ' + style('Critical Error', THEME.ACCENT_COLOR),
				style('Result:', THEME.LABEL_COLOR) + ' ' + style(error.message, THEME.ACCENT_COLOR)
			]);
			return message.channel.send(formatAnsiBlocks([block1, block2]));
		}
	},
};
