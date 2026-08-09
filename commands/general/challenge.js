import { log } from '../../utils/functions.js';
import axios from 'axios'; // Replaced node-fetch with axios

export default {
    name: 'challenge',
    description: 'Get a random challenge image.',
    aliases: ['chal'],
    usage: '',
    category: 'general',
    type: 'both',
    permissions: ['SendMessages', 'AttachFiles'], // Added AttachFiles permission
    cooldown: 5,

    execute: async (client, message, args) => {
        try {
            const response = await axios.get('https://api.alexflipnote.dev/challenge'); // Using axios instead of fetch
            if (response.status !== 200) throw new Error('Failed to fetch challenge image.');

            const imageUrl = response.data.file;

            message.channel.send(imageUrl);
        } catch (error) {
            log(`Error fetching challenge image: ${error.message}`, 'error');
            message.channel.send(`> ❌ Failed to get challenge picture: ${error.message}`); // Improved error message
        }
    }
};