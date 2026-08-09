import { log } from '../../utils/functions.js';
import axios from 'axios';

export default {
    name: 'bird',
    description: 'Get a random bird picture.',
    aliases: ['birb', 'birdpic'],
    usage: '',
    category: 'general',
    type: 'both',
    permissions: ['SendMessages', 'AttachFiles'],
    cooldown: 5,

    execute: async (client, message, args) => {
        try {
            const response = await axios.get('https://api.alexflipnote.dev/birb');
            if (response.status !== 200) throw new Error('Failed to fetch bird image.');

            const imageUrl = response.data.file;

            message.channel.send(imageUrl);
        } catch (error) {
            log(`Error fetching bird image: ${error.message}`, 'error');
            message.channel.send(`> ❌ Failed to get bird picture: ${error.message}`);
        }
    }
};