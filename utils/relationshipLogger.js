import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebhookClient } from 'discord.js-selfbot-v13';
import { log, getFormattedDate, loadConfig } from './functions.js';

// Re-export logError from functions.js
export { logError } from './functions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure relationship logs directory exists
const RELATIONSHIP_DIR = path.join(__dirname, '..', 'data', 'relationship');
if (!fs.existsSync(RELATIONSHIP_DIR)) {
    fs.mkdirSync(RELATIONSHIP_DIR, { recursive: true });
}

// Cache for webhook client
let webhookClient = null;

/**
 * Log relationship events to console, file, and webhook
 * @param {Object} options - Logging options
 * @param {string} options.event - Event type (e.g., 'friendRequest', 'friendAdd')
 * @param {Object} options.data - Event data
 * @param {Client} options.client - Discord.js client
 */
export async function logRelationship(options) {
    const { event, data, client } = options;
    const config = loadConfig();
    
    // Check if relationship logging is enabled
    if (!config.relationship_logs || !config.relationship_logs.enabled) {
        return;
    }
    
    // Format the log message based on event type
    const { consoleMessage, fileMessage, webhookEmbed } = formatRelationshipLog(event, data);
    
    // Log to console
    if (consoleMessage) {
        log(consoleMessage, 'info');
    }
    
    // Log to file
    if (fileMessage) {
        const today = getFormattedDate();
        const logFile = path.join(RELATIONSHIP_DIR, `${today}.log`);
        
        try {
            const timestamp = new Date().toISOString();
            fs.appendFileSync(logFile, `[${timestamp}] ${fileMessage}\n`);
        } catch (error) {
            logError(error, 'Failed to write relationship log to file');
        }
    }
    
    // Send webhook if URL is provided
    if (webhookEmbed && config.relationship_logs.webhook_url) {
        try {
            const webhookUrl = config.relationship_logs.webhook_url;
            
            // Skip if webhook URL is empty
            if (!webhookUrl) return;
            
            // Create webhook client if not already created
            if (!webhookClient) {
                // Parse webhook URL to get ID and token
                const match = webhookUrl.match(/discord.com\/api\/webhooks\/([^/]+)\/([^/]+)/);
                if (!match) {
                    throw new Error('Invalid webhook URL format');
                }
                
                const [, id, token] = match;
                webhookClient = new WebhookClient({ id, token });
            }
            
            // Send webhook
            await webhookClient.send({
                username: 'Barro Selfbot',
                avatarURL: 'https://i.postimg.cc/ZKc6v48X/Barro-centre.png', // You can change this to your logo
                embeds: [webhookEmbed]
            });
        } catch (error) {
            logError(error, 'Failed to send webhook');
        }
    }
}

/**
 * Format relationship log messages based on event type
 * @param {string} event - Event type
 * @param {Object} data - Event data
 * @returns {Object} Formatted messages for different outputs
 */
export function formatRelationshipLog(event, data) {
    const timestamp = new Date().toISOString();
    let consoleMessage = '';
    let fileMessage = '';
    let webhookEmbed = {
        title: '',
        description: '',
        color: 0x5865F2, // Discord blue
        timestamp: timestamp,
        footer: {
            text: 'Barro Selfbot'
        }
    };
    
    switch (event) {
        // Friend request events
        case 'friendRequest':
            consoleMessage = `Friend request received from ${chalk.cyan(data.user.tag)} (${data.user.id})`;
            fileMessage = `Friend request received from ${data.user.tag} (${data.user.id})`;
            webhookEmbed.title = '👥 Friend Request Received';
            webhookEmbed.description = `**User:** ${data.user.tag}\n**ID:** ${data.user.id}`;
            webhookEmbed.color = 0x5865F2; // Blue
            break;
            
        case 'friendRequestSent':
            consoleMessage = `Friend request sent to ${chalk.cyan(data.user.tag)} (${data.user.id})`;
            fileMessage = `Friend request sent to ${data.user.tag} (${data.user.id})`;
            webhookEmbed.title = '📤 Friend Request Sent';
            webhookEmbed.description = `**User:** ${data.user.tag}\n**ID:** ${data.user.id}`;
            webhookEmbed.color = 0x5865F2; // Blue
            break;
            
        case 'friendRequestCancelled':
            consoleMessage = `Friend request from ${chalk.cyan(data.user.tag)} was cancelled`;
            fileMessage = `Friend request from ${data.user.tag} was cancelled`;
            webhookEmbed.title = '🚫 Friend Request Cancelled';
            webhookEmbed.description = `**User:** ${data.user.tag}\n**ID:** ${data.user.id}`;
            webhookEmbed.color = 0xED4245; // Red
            break;
            
        case 'friendRequestWithdrawn':
            consoleMessage = `Friend request to ${chalk.cyan(data.user.tag)} was withdrawn`;
            fileMessage = `Friend request to ${data.user.tag} was withdrawn`;
            webhookEmbed.title = '↩️ Friend Request Withdrawn';
            webhookEmbed.description = `**User:** ${data.user.tag}\n**ID:** ${data.user.id}`;
            webhookEmbed.color = 0xED4245; // Red
            break;
            
        // Friend events
        case 'friendAdd':
            consoleMessage = `${chalk.green('New friend added')}: ${chalk.cyan(data.user.tag)} (${data.user.id})`;
            fileMessage = `New friend added: ${data.user.tag} (${data.user.id})`;
            webhookEmbed.title = '✅ Friend Added';
            webhookEmbed.description = `**User:** ${data.user.tag}\n**ID:** ${data.user.id}`;
            webhookEmbed.color = 0x57F287; // Green
            break;
            
        case 'friendRemove':
            consoleMessage = `${chalk.red('Friend removed')}: ${chalk.cyan(data.user.tag)} (${data.user.id})`;
            fileMessage = `Friend removed: ${data.user.tag} (${data.user.id})`;
            webhookEmbed.title = '❌ Friend Removed';
            webhookEmbed.description = `**User:** ${data.user.tag}\n**ID:** ${data.user.id}`;
            webhookEmbed.color = 0xED4245; // Red
            break;
            
        // Block events
        case 'friendBlock':
            consoleMessage = `${chalk.red('User blocked')}: ${chalk.cyan(data.user.tag)} (${data.user.id})`;
            fileMessage = `User blocked: ${data.user.tag} (${data.user.id})`;
            webhookEmbed.title = '🚫 User Blocked';
            webhookEmbed.description = `**User:** ${data.user.tag}\n**ID:** ${data.user.id}`;
            webhookEmbed.color = 0xED4245; // Red
            break;
            
        case 'friendUnblock':
            consoleMessage = `${chalk.green('User unblocked')}: ${chalk.cyan(data.user.tag)} (${data.user.id})`;
            fileMessage = `User unblocked: ${data.user.tag} (${data.user.id})`;
            webhookEmbed.title = '✅ User Unblocked';
            webhookEmbed.description = `**User:** ${data.user.tag}\n**ID:** ${data.user.id}`;
            webhookEmbed.color = 0x57F287; // Green
            break;
            
        // Status and activity events
        case 'statusChange':
            consoleMessage = `${chalk.yellow('Status change')}: ${chalk.cyan(data.user.tag)} is now ${chalk.yellow(data.statusName || data.status)}`;
            fileMessage = `Status change: ${data.user.tag} is now ${data.statusName || data.status}`;
            webhookEmbed.title = '🔄 Friend Status Changed';
            webhookEmbed.description = `**User:** ${data.user.tag}\n**New Status:** ${data.statusName || data.status}`;
            if (data.oldStatus) {
                webhookEmbed.description += `\n**Old Status:** ${data.oldStatusName || data.oldStatus}`;
            }
            
            // Set color based on status
            switch(data.status) {
                case 'online':
                    webhookEmbed.color = 0x57F287; // Green
                    break;
                case 'idle':
                    webhookEmbed.color = 0xFEE75C; // Yellow
                    break;
                case 'dnd':
                    webhookEmbed.color = 0xED4245; // Red
                    break;
                case 'offline':
                case 'invisible':
                    webhookEmbed.color = 0x95A5A6; // Gray
                    break;
                default:
                    webhookEmbed.color = 0xFEE75C; // Default yellow
            }
            break;
            
        case 'activityChange':
            // Format the console message
            if (data.activity) {
                consoleMessage = `${chalk.magenta('Activity change')}: ${chalk.cyan(data.user.tag)} is now ${chalk.magenta(data.activity)}`;
            } else {
                consoleMessage = `${chalk.magenta('Activity change')}: ${chalk.cyan(data.user.tag)} is no longer doing anything`;
            }
            
            // Format the file message
            fileMessage = `Activity change: ${data.user.tag} is now ${data.activity || 'not doing anything'}`;
            
            // Format the webhook embed
            webhookEmbed.title = '🎮 Friend Activity Changed';
            webhookEmbed.description = `**User:** ${data.user.tag}`;
            
            if (data.activity) {
                webhookEmbed.description += `\n**Activity:** ${data.activity}`;
            } else {
                webhookEmbed.description += `\n**Activity:** None`;
            }
            
            if (data.oldActivity) {
                webhookEmbed.description += `\n**Previous Activity:** ${data.oldActivity}`;
            }
            
            // Add rich details if available
            if (data.activityRaw) {
                if (data.activityRaw.details) {
                    webhookEmbed.description += `\n**Details:** ${data.activityRaw.details}`;
                }
                if (data.activityRaw.state) {
                    webhookEmbed.description += `\n**State:** ${data.activityRaw.state}`;
                }
                if (data.activityRaw.assets && data.activityRaw.assets.largeImageURL) {
                    webhookEmbed.thumbnail = { url: data.activityRaw.assets.largeImageURL };
                }
            }
            
            webhookEmbed.color = 0xEB459E; // Pink
            break;
            
        // Profile update events
        case 'usernameChange':
            consoleMessage = `${chalk.cyan('Username change')}: ${chalk.yellow(data.oldUsername)} → ${chalk.green(data.newUsername)}`;
            fileMessage = `Username change: ${data.oldUsername} → ${data.newUsername}`;
            webhookEmbed.title = '📝 Friend Changed Username';
            webhookEmbed.description = `**User:** ${data.user.tag}\n**Old Username:** ${data.oldUsername}\n**New Username:** ${data.newUsername}`;
            webhookEmbed.color = 0x5865F2; // Blue
            break;
            
        case 'avatarChange':
            consoleMessage = `${chalk.cyan('Avatar change')}: ${chalk.cyan(data.user.tag)} updated their profile picture`;
            fileMessage = `Avatar change: ${data.user.tag} updated their profile picture`;
            webhookEmbed.title = '🖼️ Friend Changed Avatar';
            webhookEmbed.description = `**User:** ${data.user.tag}`;
            webhookEmbed.thumbnail = { url: data.newAvatar };
            webhookEmbed.color = 0x5865F2; // Blue
            break;
            
        // Guild events
        case 'guildJoin':
            consoleMessage = `${chalk.green('Joined server')}: ${chalk.cyan(data.guild.name)} (${data.guild.id}) with ${chalk.yellow(data.guild.memberCount)} members`;
            fileMessage = `Joined server: ${data.guild.name} (${data.guild.id}) with ${data.guild.memberCount} members`;
            webhookEmbed.title = '🟢 Joined Server';
            webhookEmbed.description = `**Server:** ${data.guild.name}\n**ID:** ${data.guild.id}\n**Members:** ${data.guild.memberCount}`;
            webhookEmbed.color = 0x57F287; // Green
            
            // Add owner info if available
            if (data.owner) {
                consoleMessage += `, owned by ${chalk.cyan(data.owner.user.tag)} (${data.guild.ownerId})`;
                fileMessage += `, owned by ${data.owner.user.tag} (${data.guild.ownerId})`;
                webhookEmbed.description += `\n**Owner:** ${data.owner.user.tag}`;
            } else if (data.guild.ownerId) {
                consoleMessage += `, owned by ID: ${chalk.cyan(data.guild.ownerId)}`;
                fileMessage += `, owned by ID: ${data.guild.ownerId}`;
                webhookEmbed.description += `\n**Owner ID:** ${data.guild.ownerId}`;
            }
            break;
            
        case 'guildLeave':
            consoleMessage = `${chalk.red('Left server')}: ${chalk.cyan(data.guild.name)} (${data.guild.id})`;
            fileMessage = `Left server: ${data.guild.name} (${data.guild.id})`;
            webhookEmbed.title = '🔴 Left Server';
            webhookEmbed.description = `**Server:** ${data.guild.name}\n**ID:** ${data.guild.id}`;
            webhookEmbed.color = 0xED4245; // Red
            break;
            
        // Relationship update (generic event)
        case 'relationshipUpdate':
            consoleMessage = `${chalk.blue('Relationship update')}: ${data.user.tag} (${data.user.id}) - Type: ${data.type || 'unknown'}`;
            fileMessage = `Relationship update: ${data.user.tag} (${data.user.id}) - Type: ${data.type || 'unknown'}`;
            webhookEmbed.title = '🔄 Relationship Updated';
            webhookEmbed.description = `**User:** ${data.user.tag}\n**ID:** ${data.user.id}\n**Type:** ${data.type || 'unknown'}`;
            webhookEmbed.color = 0x5865F2; // Blue
            break;
            
        // Default case for unknown events
        default:
            consoleMessage = `${chalk.blue('Relationship event')}: ${event}`;
            fileMessage = `Relationship event: ${event}`;
            webhookEmbed.title = 'Relationship Event';
            webhookEmbed.description = `Event: ${event}`;
    }
    
    return { consoleMessage, fileMessage, webhookEmbed };
}