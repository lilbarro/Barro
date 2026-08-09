import { logRelationship, logError } from '../../utils/relationshipLogger.js';
import { log } from '../../utils/functions.js';

export default {
    name: 'userUpdate',
    once: false,
    
    /**
     * Handle user update events (username/avatar changes)
     * @param {Client} client - Discord.js client instance
     * @param {User} oldUser - The old user data
     * @param {User} newUser - The new user data
     */
    execute: async (client, oldUser, newUser) => {
        try {
            // Debug user update if debug mode is enabled
            if (client.config.debug_mode && client.config.debug_mode.enabled) {
                log(`[DEBUG] userUpdate event received`, 'debug');
                log(`[DEBUG] User: ${newUser.tag} (${newUser.id})`, 'debug');
                
                if (oldUser.username !== newUser.username) {
                    log(`[DEBUG] Username changed: ${oldUser.username} -> ${newUser.username}`, 'debug');
                }
                
                if (oldUser.discriminator !== newUser.discriminator) {
                    log(`[DEBUG] Discriminator changed: ${oldUser.discriminator} -> ${newUser.discriminator}`, 'debug');
                }
                
                if (oldUser.avatar !== newUser.avatar) {
                    log(`[DEBUG] Avatar changed`, 'debug');
                }
            }
            
            // Skip if relationships manager is not available
            if (!client.relationships) {
                if (client.config.debug_mode && client.config.debug_mode.enabled) {
                    log(`[DEBUG] Skipping userUpdate: relationships manager not available`, 'debug');
                }
                return;
            }
            
            // Check if the user is a friend - we need to be more thorough here
            let isFriend = false;
            
            // Method 1: Check relationships cache
            if (client.relationships && client.relationships.cache.has(newUser.id)) {
                const relationshipType = client.relationships.cache.get(newUser.id).type;
                isFriend = relationshipType === 'FRIEND';
                
                if (client.config.debug_mode && client.config.debug_mode.enabled) {
                    log(`[DEBUG] Relationship type from cache: ${relationshipType}`, 'debug');
                }
            }
            
            // Method 2: Check if the user is in our DM list (friends often are)
            if (!isFriend && newUser.dmChannel) {
                isFriend = true;
                if (client.config.debug_mode && client.config.debug_mode.enabled) {
                    log(`[DEBUG] User has DM channel, assuming friend`, 'debug');
                }
            }
            
            // Method 3: Special case for specific users we want to track
            if (!isFriend) {
                // Check if this is a user we specifically want to track
                if (client.config.relationship_logs.special_users && client.config.relationship_logs.special_users.includes(newUser.id)) {
                    isFriend = true;
                    if (client.config.debug_mode && client.config.debug_mode.enabled) {
                        log(`[DEBUG] User is in special tracking list`, 'debug');
                    }
                }
            }
            
            // Method 4: Check if we have mutual guilds with the user
            if (!isFriend && newUser.mutualGuilds && newUser.mutualGuilds.size > 0) {
                // This is a weaker signal, but we'll use it if configured to track all users
                if (client.config.relationship_logs && client.config.relationship_logs.track_all_users) {
                    isFriend = true;
                    if (client.config.debug_mode && client.config.debug_mode.enabled) {
                        log(`[DEBUG] User has mutual guilds, tracking due to track_all_users setting`, 'debug');
                    }
                }
            }
            
            // Skip if not a friend and we're not tracking all users
            if (!isFriend) {
                if (client.config.debug_mode && client.config.debug_mode.enabled) {
                    log(`[DEBUG] Skipping userUpdate: user is not a friend`, 'debug');
                }
                return;
            }
            
            // Check for username change
            if (oldUser.username !== newUser.username || oldUser.discriminator !== newUser.discriminator) {
                if (client.config.debug_mode && client.config.debug_mode.enabled) {
                    log(`[DEBUG] Username/discriminator change detected`, 'debug');
                }
                
                await logRelationship({
                    event: 'usernameChange',
                    data: { 
                        user: newUser,
                        oldUsername: oldUser.tag,
                        newUsername: newUser.tag
                    },
                    client
                });
            }
            
            // Check for avatar change
            if (oldUser.avatar !== newUser.avatar) {
                if (client.config.debug_mode && client.config.debug_mode.enabled) {
                    log(`[DEBUG] Avatar change detected`, 'debug');
                }
                
                await logRelationship({
                    event: 'avatarChange',
                    data: { 
                        user: newUser,
                        oldAvatar: oldUser.displayAvatarURL(),
                        newAvatar: newUser.displayAvatarURL()
                    },
                    client
                });
            }
        } catch (error) {
            logError(error, 'User Update Handler Error');
            
            // Additional debug logging for errors
            if (client.config.debug_mode && client.config.debug_mode.enabled) {
                log(`[DEBUG] Error in userUpdate handler: ${error.message}`, 'debug');
                console.error(error);
            }
        }
    }
};