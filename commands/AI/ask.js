import Groq from 'groq-sdk';

export default {
    name: 'ask',
    description: "Asks a question to Groq AI using the llama-3.1-8b-instant model.",
    aliases: ['ai', 'chat'],
    usage: '<query>',
    category: 'AI',
    type: 'both',
    permissions: ['SendMessages'],
    cooldown: 5,
    async execute(client, message, args) {
        const query = args.join(' ');

        if (!query) {
            return message.channel.send(`Usage: \`${client.prefix}ask <query>\``);
        }

        const groqApiKey = client.config.ai?.groq_api_key;

        if (!groqApiKey) {
            return message.channel.send('> ❌ **Error:** Groq API key not found in config.yaml. Please add it under the `ai` section.');
        }

        const groq = new Groq({
            apiKey: groqApiKey
        });

        try {
            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    {
                        role: 'user',
                        content: query,
                    },
                ],
                model: 'llama-3.1-8b-instant',
                max_tokens: 1500, // Approximately 2000 words
            });

            let responseContent = chatCompletion.choices[0]?.message?.content;

            if (responseContent) {
                // Discord message limit is 2000 characters, so we need to split if longer
                if (responseContent.length > 2000) {
                    const chunks = responseContent.match(/[^]{1,2000}/g);
                    for (const chunk of chunks) {
                        await message.channel.send(chunk);
                    }
                } else {
                    await message.channel.send(responseContent);
                }
            } else {
                await message.channel.send('> ❌ **Error:** Groq did not return a response.');
            }

        } catch (error) {
            console.error('Error communicating with Groq AI:', error);
            await message.channel.send('> ❌ **Error:** There was an error trying to get a response from Groq AI. Please try again later.');
        }
    },
};
