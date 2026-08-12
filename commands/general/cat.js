import { log } from '../../utils/functions.js';
import axios from 'axios';

export default {
    name: 'cat',
    description: 'Get a random cat picture.',
    aliases: ['catpic'],
    usage: '',
    category: 'general',
    type: 'both',
    permissions: ['SendMessages', 'AttachFiles'],
    cooldown: 10,

    execute: async (client, message, args) => {
        try {
            const response = await axios.get('https://api.alexflipnote.dev/cats');
            if (response.status !== 200) throw new Error('Failed to fetch cat image.');

            const imageUrl = response.data.file;

            message.channel.send(imageUrl);
        } catch (error) {
            log(`Error fetching cat image: ${error.message}`, 'error');
            message.channel.send(formatAnsiBlock([
                style('[ CAT ]', '1;30'),
                '',
                style('ERROR:', '1;31') + ' ' + style(`Failed to get cat picture: ${error.message}`, '0;97')
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