import axios from 'axios';
import FormData from 'form-data';
import { log, loadConfig } from '../../utils/functions.js';

export default {
    name: 'stealsticker',
    description: 'Steal a sticker from a replied message (supports PNG, APNG, GIF, and Lottie)',
    aliases: ['stickersnipe', 'snipesicker', 'copysticker'],
    usage: 'stealsticker (reply to message)',
    category: 'moderation',
    type: 'server_only',
    permissions: ['ManageExpressions'],
    cooldown: 5,

    execute: async (client, message, args) => {
        // Check if the message is a reply
        if (!message.reference) {
            return message.channel.send('❌ Please reply to a message containing a sticker!');
        }

        try {
            // Fetch the referenced message
            const refMsg = await message.channel.messages.fetch(message.reference.messageId);

            // Ensure the referenced message contains a sticker
            if (!refMsg.stickers || refMsg.stickers.size === 0) {
                return message.channel.send('❌ No sticker found in the replied message!');
            }

            const sticker = refMsg.stickers.first();

            // Debug log the sticker format
            log(`Sticker format detected: ${sticker.format} (type: ${typeof sticker.format})`, 'debug');

            // Determine the correct URL and file extension based on sticker format
            let stickerUrl;
            let fileExtension;
            
            // Handle both numeric and string format values
            const formatValue = typeof sticker.format === 'string' ? sticker.format.toUpperCase() : sticker.format;
            
            switch (formatValue) {
                case 1:
                case 'PNG':
                    stickerUrl = `https://cdn.discordapp.com/stickers/${sticker.id}.png`;
                    fileExtension = 'png';
                    break;
                case 2:
                case 'APNG':
                    stickerUrl = `https://cdn.discordapp.com/stickers/${sticker.id}.png`;
                    fileExtension = 'png';
                    break;
                case 3:
                case 'LOTTIE':
                    stickerUrl = `https://cdn.discordapp.com/stickers/${sticker.id}.json`;
                    fileExtension = 'json';
                    break;
                case 4:
                case 'GIF':
                    stickerUrl = `https://media.discordapp.net/stickers/${sticker.id}.gif`;
                    fileExtension = 'gif';
                    break;
                default:
                    return message.channel.send(`❌ Unsupported sticker format: ${sticker.format} (${typeof sticker.format})! Please report this to the developer.`);
            }

            log(`Attempting to steal sticker: ${sticker.name} (Format: ${sticker.format}, URL: ${stickerUrl})`, 'debug');
            
            // Fetch sticker data with appropriate headers
            const response = await axios.get(stickerUrl, {
                responseType: 'arraybuffer',
                headers: {
                    'Accept': sticker.format === 3 ? 'application/json' : 'image/*',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                timeout: 10000
            });
            
            if (response.status !== 200) {
                return message.channel.send(`❌ Failed to fetch sticker (Status: ${response.status})`);
            }

            // Convert response data to buffer
            const buffer = Buffer.from(response.data);

            // Validate buffer size (Discord limit is ~500KB for most stickers)
            if (buffer.length > 512000) {
                return message.channel.send('❌ Sticker file is too large! (Max 500KB)');
            }

            if (buffer.length === 0) {
                return message.channel.send('❌ Downloaded sticker file is empty!');
            }

            log(`Downloaded sticker data: ${buffer.length} bytes`, 'debug');
            
            // Debug: Check the first few bytes to verify file type
            const firstBytes = buffer.slice(0, 8);
            log(`First 8 bytes: ${Array.from(firstBytes).map(b => b.toString(16).padStart(2, '0')).join(' ')}`, 'debug');

            // Validate file signature
            const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
            const isGIF = buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46;
            const isJSON = buffer[0] === 0x7B || buffer[0] === 0x20 || buffer[0] === 0x0A; // { or space or newline

            log(`File type validation - PNG: ${isPNG}, GIF: ${isGIF}, JSON: ${isJSON}`, 'debug');

            // For PNG files, extract dimensions (Discord has specific size requirements)
            if (isPNG) {
                // PNG dimensions are stored at bytes 16-23 (width at 16-19, height at 20-23)
                const width = buffer.readUInt32BE(16);
                const height = buffer.readUInt32BE(20);
                log(`PNG dimensions: ${width}x${height}`, 'debug');
                
                // Discord sticker requirements: 320x320 pixels for static stickers
                if (width > 320 || height > 320) {
                    return message.channel.send(`❌ Sticker dimensions too large! (${width}x${height} - Max: 320x320)`);
                }
                if (width < 32 || height < 32) {
                    return message.channel.send(`❌ Sticker dimensions too small! (${width}x${height} - Min: 32x32)`);
                }
            }

            // Create the sticker with proper parameters for discord.js-selfbot-v13
            // Try different approaches based on the error
            log(`Attempting to create sticker with buffer length: ${buffer.length}`, 'debug');
            
            // Try approach 1: Direct buffer (as per MessagePayload.resolveFile line 307)
            try {
                const newSticker = await message.guild.stickers.create(
                    buffer,
                    sticker.name.substring(0, 30),
                    '⭐',
                    {
                        description: 'Stolen sticker',
                        reason: `Sticker stolen by ${message.author.tag}`
                    }
                );
                
                message.channel.send(`✅ Successfully stolen ${sticker.format === 3 ? 'animated' : 'static'} sticker: \`${newSticker.name}\` (Format: ${['Unknown', 'PNG', 'APNG', 'Lottie', 'GIF'][sticker.format]})`);
                return;
            } catch (directBufferError) {
                // log(`Direct buffer approach failed: ${directBufferError.message}`, 'error');
                
                // Try approach 2: File object with attachment property
                const fileObject = {
                    attachment: buffer,
                    name: `${sticker.name.substring(0, 30)}.${fileExtension}`
                };
                
                log(`Trying file object approach with name: ${fileObject.name}`, 'debug');
                
                try {
                    const newSticker = await message.guild.stickers.create(
                        fileObject,
                        sticker.name.substring(0, 30),
                        '⭐',
                        {
                            description: 'Stolen sticker',
                            reason: `Sticker stolen by ${message.author.tag}`
                        }
                    );
                    
                    message.channel.send(`✅ Successfully stolen ${sticker.format === 3 ? 'animated' : 'static'} sticker: \`${newSticker.name}\` (Format: ${['Unknown', 'PNG', 'APNG', 'Lottie', 'GIF'][sticker.format]})`);
                    return;
                } catch (fileObjectError) {
                    // log(`File object approach failed: ${fileObjectError.message}`, 'error');
                    
                    // Try approach 3: Manual FormData approach using Discord API directly
                    log(`Trying direct API approach with FormData`, 'debug');
                    
                    const form = new FormData();
                    form.append('file', buffer, {
                        filename: `sticker.${fileExtension}`,
                        contentType: sticker.format === 3 ? 'application/json' : 'image/png'
                    });
                    form.append('name', sticker.name.substring(0, 30));
                    form.append('tags', '⭐');
                    form.append('description', 'Stolen sticker');
                    
                    const config = loadConfig();
                    const apiVersion = config.api.version;
                    
                    const apiResponse = await axios.post(
                        `https://discord.com/api/${apiVersion}/guilds/${message.guild.id}/stickers`,
                        form,
                        {
                            headers: {
                                'Authorization': `${client.token}`,
                                'Content-Type': `multipart/form-data; boundary=${form._boundary}`
                            }
                        }
                    );
                    
                    if (apiResponse.status === 201) {
                        const newSticker = apiResponse.data;
                        message.channel.send(`✅ Successfully stolen ${sticker.format === 3 ? 'animated' : 'static'} sticker: \`${newSticker.name}\` (Format: ${['Unknown', 'PNG', 'APNG', 'Lottie', 'GIF'][sticker.format]})`);
                        return;
                    } else {
                        log(`API returned status ${apiResponse.status}`, 'error');
                    }
                }
            }
        } catch (error) {
            // Enhanced error handling
            if (error.response) {
                // HTTP error from axios
                log(`HTTP Error: ${error.response.status} - ${error.response.statusText}`, 'error');
                if (error.response.status === 404) {
                    message.channel.send('❌ Sticker not found! It may have been deleted or the URL format is incorrect.');
                } else if (error.response.status === 403) {
                    message.channel.send('❌ Access denied! Cannot download this sticker.');
                } else {
                    message.channel.send(`❌ Failed to download sticker (HTTP ${error.response.status})`);
                }
            } else if (error.message.includes('Lottie stickers cannot be uploaded')) {
                message.channel.send('❌ Cannot upload Lottie stickers - Discord API limitation!');
            } else if (error.message.includes('Invalid Asset')) {
                log(`Invalid Asset Error Details: ${JSON.stringify(error, null, 2)}`, 'error');
                message.channel.send('❌ Invalid sticker data! The downloaded file may be corrupted or in an unsupported format.');
            } else if (error.code === 50013) {
                message.channel.send('❌ I need the Manage Expressions permission!');
            } else if (error.code === 30039) {
                message.channel.send('❌ Maximum number of stickers reached for this server!');
            } else if (error.code === 50035) {
                message.channel.send('❌ Invalid sticker data format!');
            } else if (error.code === 50045) {
                message.channel.send('❌ File uploaded is too large!');
            } else if (error.code === 40005) {
                message.channel.send('❌ Request entity too large!');
            } else {
                log(`Failed to steal sticker: ${error.message}`, 'error');
                log(`Error code: ${error.code}`, 'error');
                log(`Error stack: ${error.stack}`, 'error');
                message.channel.send(`❌ An error occurred: ${error.message} (Code: ${error.code || 'Unknown'})`);
            }
        }
    },
};