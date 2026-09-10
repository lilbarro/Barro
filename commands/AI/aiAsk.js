import { log, formatHeaderTitle, formatAnsiBlock, formatAnsiBlocks, style } from '../../utils/functions.js';
import { THEME } from '../../utils/theme.js';
import AIProvider from '../../utils/AIProvider.js';

export default {
    name: 'aiAsk',
    description: "Ask AI a question",
    aliases: ['ask', 'ai', 'chat'],
    usage: '<query>',
    category: 'ai',
    type: 'both',
    permissions: ['SendMessages'],
    cooldown: 6,

    async execute(client, message, args) {
        const isHelpRequest = args[0] && ['help', '--help', '-h'].includes(args[0].toLowerCase());

        const query = args.join(' ');

        if (!query) {
            return message.channel.send(formatAskHelp(client.prefix, !isHelpRequest));
        }

        if (isHelpRequest) {
            return message.channel.send(formatAskHelp(client.prefix));
        }

        const statusMsg = await message.channel.send(formatAnsiBlock([
            formatHeaderTitle('Barro') + style(` AI | Thinking...`, THEME.ACCENT_COLOR),
            style(`Query: `, THEME.LABEL_COLOR) + style(query.length > 30 ? query.slice(0, 27) + '...' : query, THEME.DIVIDER_COLOR)
        ]));

        try {
            const responseContent = await AIProvider.request(query, {
                systemPrompt: 'You are a helpful and concise AI assistant. Respond naturally and avoid corporate fillers.',
                signal: AbortSignal.timeout(30000)
            });

            if (!responseContent) {
                return statusMsg.edit(formatAnsiBlock([
                    style(`ERROR: No response`, THEME.ACCENT_COLOR),
                    style(`The AI returned an empty response.`, THEME.ACCENT_COLOR)
                ]));
            }

            // Delete status message and send response
            await statusMsg.delete().catch(() => {});

            const safeResponse = highlightImportantParts(responseContent
                .replace(/```/g, "`` `")
                .split(/\r?\n/));
            const finalReport = formatAnsiBlocks([
                [formatHeaderTitle('Barro AI')],
                [style('Query: ', THEME.LABEL_COLOR) + style(query, THEME.ACCENT_COLOR)],
                safeResponse
            ]);

            if (finalReport.length > 2000) {
                const chunks = finalReport.match(/[^]{1,2000}/g);
                for (const chunk of chunks) {
                    await message.channel.send(chunk);
                }
            } else {
                await message.channel.send(finalReport);
            }

            log(`AI query processed for ${message.author.tag}`, 'debug');

        } catch (error) {
            log(`Error in AI command: ${error.message}`, 'error');
            await statusMsg.edit(formatAnsiBlock([
                style(`ERROR: AI Failure`, THEME.ACCENT_COLOR),
                style(error.message, THEME.ACCENT_COLOR)
            ]));
        }
    }
};

function formatAskHelp(prefix, includeError = false) {
    const blocks = [
        [formatHeaderTitle('Barro AI Ask')],
        [
            style('Usage', THEME.HEADER_BOLD_COLOR),
            style(`${prefix}aiAsk <query>`, THEME.LABEL_COLOR) + style(' | Ask the configured AI provider', THEME.ACCENT_COLOR),
            style(`${prefix}ask <query>`, THEME.LABEL_COLOR) + style(' | Alias', THEME.ACCENT_COLOR),
            style(`${prefix}ai <query>`, THEME.LABEL_COLOR) + style(' | Alias', THEME.ACCENT_COLOR),
            style(`${prefix}chat <query>`, THEME.LABEL_COLOR) + style(' | Alias', THEME.ACCENT_COLOR)
        ],
        [
            style('Info', THEME.HEADER_BOLD_COLOR),
            style('Response:', THEME.LABEL_COLOR) + style(' Answers are returned with highlighted headings, labels, and key text.', THEME.ACCENT_COLOR)
        ]
    ];

    if (includeError) {
        blocks.splice(2, 0, [
            style('ERROR: No query provided', THEME.ACCENT_COLOR),
            style('Usage: ', THEME.LABEL_COLOR) + style(`${prefix}ask <query>`, THEME.ACCENT_COLOR)
        ]);
    }

    return formatAnsiBlocks(blocks);
}

function highlightImportantParts(lines) {
    return lines.map((line) => {
        const heading = line.match(/^\s*#{1,6}\s+(.+)$/);
        if (heading) return style(heading[1], THEME.ACCENT_COLOR);

        const highlighted = line.replace(/\*\*(.+?)\*\*/g, (_, text) => style(text, THEME.ACCENT_COLOR));
        const label = highlighted.match(/^(\s*(?:[-*]\s+)?[^:]{1,40}:)(.*)$/);
        if (label) return style(label[1], THEME.ACCENT_COLOR) + label[2];
        return highlighted;
    });
}
