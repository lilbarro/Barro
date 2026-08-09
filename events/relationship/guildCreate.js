import { logRelationship, logError } from '../../utils/relationshipLogger.js';

export default {
    name: 'guildCreate',
    once: false,
    
    /**
     * Handle guild join events
     * @param {Client} client - Discord.js client instance
     * @param {Guild} guild - The guild that was joined
     */
    execute: async (client, guild) => {
        try {
            // Get owner safely
            let owner = null;
            try {
                if (guild.ownerId) {
                    owner = await guild.members.fetch(guild.ownerId);
                }
            } catch (e) {
                // Owner might not be fetchable, continue without it
                logError(e, 'Failed to fetch guild owner');
            }
            
            await logRelationship({
                event: 'guildJoin',
                data: { 
                    guild: guild,
                    owner: owner
                },
                client
            });
        } catch (error) {
            logError(error, 'Guild Create Handler Error');
        }
    }
};