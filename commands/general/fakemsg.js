import axios from 'axios';
import fs from 'fs';

export default {
    name: 'fakemsg',
    description: 'Send a fake message.',
    aliases: ['fake'],
    usage: '@user <text>',
    category: 'general',
    type: 'both',
    permissions: ['SendMessages', 'AttachFiles'],
    cooldown: 30,

    execute: async (client, message, args) => {
        // Validate user mention and message text
        const user = message.mentions.users.first();
        const text = args.slice(1).join(' ');

        if (!user || !text) {
            return message.channel.send(formatAnsiBlock([
                style('[ FAKEMSG ]', '1;30'),
                '',
                style('USAGE:', '1;31') + ' ' + style(`${client.prefix}fakemsg @user <message>`, '0;97')
            ]));
        }

        try {
            const response = await axios.get(`https://benny.fun/api/discordmessage?avatar_url=${encodeURIComponent(user.avatarURL())}&username=${encodeURIComponent(user.username)}&text=${encodeURIComponent(text)}`, { responseType: 'arraybuffer' });
            if (response.status !== 200) throw new Error('Failed to fetch fake message.');

            const buffer = Buffer.from(response.data);
            const filePath = './fakemsg.png';
            fs.writeFileSync(filePath, buffer);

            await message.channel.send({ files: [filePath] });
            fs.unlinkSync(filePath); // Clean up after sending
        } catch (error) {
            message.channel.send(formatAnsiBlock([
                style('[ FAKEMSG ]', '1;30'),
                '',
                style('ERROR:', '1;31') + ' ' + style(`Failed to send fake message: ${error.message}`, '0;97')
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