import Groq from 'groq-sdk';
import { log } from '../../utils/functions.js';

export default {
    name: 'ask',
    description: "Asks a question to Groq AI using the llama-3.1-8b-instant model.",
    aliases: ['ai', 'chat'],
    usage: '<query>',
    category: 'ai',
    type: 'both',
    permissions: ['SendMessages'],
    cooldown: 5,

    async execute(client, message, args) {
        const query = args.join(' ');

        if (!query) {
            return message.channel.send(formatAnsiBlock([
                style(`ERROR: No query provided`, `1;94`),
                style(`Usage: `, '0;97') + style(`${client.prefix}ask <query>`, '0;34')
            ]));
        }

        const groqApiKey = client.config.ai?.groq_api_key;

        if (!groqApiKey) {
            return message.channel.send(formatAnsiBlock([
                style(`ERROR: API Key Missing`, `1;94`),
                style(`Add groq_api_key to the AI section in config.yaml`, '0;34')
            ]));
        }

        const statusMsg = await message.channel.send(formatAnsiBlock([
            style(`Barro`, `4;30`) + style(` AI | Thinking...`, '0;34'),
            style(`Query: `, '0;97') + style(query.length > 30 ? query.slice(0, 27) + '...' : query, '0;30')
        ]));

        try {
            const groq = new Groq({ apiKey: groqApiKey });

            const chatCompletion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: query }],
                model: 'llama-3.1-8b-instant',
                max_tokens: 1500,
            });

            const responseContent = chatCompletion.choices[0]?.message?.content;

            if (!responseContent) {
                return statusMsg.edit(formatAnsiBlock([
                    style(`ERROR: No response`, `1;94`),
                    style(`The AI returned an empty response.`, '0;34')
                ]));
            }

            // Delete status message and send response
            await statusMsg.delete().catch(() => {});

            if (responseContent.length > 2000) {
                const chunks = responseContent.match(/[^]{1,2000}/g);
                for (const chunk of chunks) {
                    await message.channel.send(chunk);
                }
            } else {
                await message.channel.send(responseContent);
            }

            log(`AI query processed for ${message.author.tag}`, 'debug');

        } catch (error) {
            log(`Error in AI command: ${error.message}`, 'error');
            await statusMsg.edit(formatAnsiBlock([
                style(`ERROR: AI Failure`, `1;94`),
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

