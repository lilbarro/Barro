import { log } from '../utils/functions.js';

export default {
    name: 'debug',
    once: false,
    
    /**
     * Debug event handler to log all events
     * @param {Client} client - Discord.js client instance
     * @param {string} info - Debug information
     */
    execute: async (client, info) => {
        // Only log if debug mode is enabled
        if (client.config.debug_mode && client.config.debug_mode.enabled) {
            if (info.includes('RELATIONSHIP') || 
                info.includes('PRESENCE_UPDATE') || 
                info.includes('USER_UPDATE') || 
                info.includes('FRIEND')) {
                log(`[DEBUG] ${info}`, 'debug');
            }
        }
    }
};