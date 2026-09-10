import { log } from "../utils/functions.js";
import StalkManager from "../utils/StalkManager.js";

export default {
  name: "messageDelete",
  once: false,

  execute: async (client, message) => {
    try {
      if (!client._deletedMessages) {
        client._deletedMessages = new Map();
        log("Initialized deleted messages cache", "debug");
      }

      // Log every deletion event to terminal for debugging
      log(`messageDelete event fired for message ID: ${message.id}`, "debug");

      let cachedMsg = null;
      if (client._messageCache && client._messageCache.has(message.channel.id)) {
        const channelCache = client._messageCache.get(message.channel.id);
        cachedMsg = channelCache.find(m => m.id === message.id);
        log(`Found message in custom cache: ${!!cachedMsg}`, "debug");
      }

      const finalMsg = cachedMsg || message;

      if (!finalMsg || !finalMsg.author) {
        log(`Skipping: No author found`, "debug");
        return;
      }

      if (finalMsg.author.bot) {
        log(`Skipping: Bot message`, "debug");
        return;
      }

      // Skip if the message is from an OWNER
      const owners = client.config?.owners || [];
      if (owners.includes(finalMsg.author.id)) {
        log(`Skipping: Owner message`, "debug");
        return;
      }

      log(`Caching deleted message from ${finalMsg.author.tag} in ${message.channel.id}`, "debug");

      const deletedMessageData = {
        content: finalMsg.content || "",
        author: {
          id: finalMsg.author.id,
          tag: finalMsg.author.tag,
          displayAvatarURL: finalMsg.author.displayAvatarURL || (typeof finalMsg.author.displayAvatarURL === 'function' ? finalMsg.author.displayAvatarURL() : null),
        },
        timestamp: finalMsg.timestamp || Date.now(),
        attachments: finalMsg.attachments || [],
        channelType: message.channel.type,
        guildName: message.guild?.name || null,
        channelName: message.channel.name || null,
      };

      // Store in array, keeping last 10 messages per channel
      if (!client._deletedMessages.has(message.channel.id)) {
        client._deletedMessages.set(message.channel.id, []);
      }
      const channelMessages = client._deletedMessages.get(message.channel.id);
      channelMessages.unshift(deletedMessageData); // Add to beginning
      if (channelMessages.length > 10) {
        channelMessages.pop(); // Remove oldest if more than 10
      }

      if (StalkManager.isStalking(message.author.id)) {
        StalkManager.logMessageEvent(message.author.id, 'MESSAGE_DELETED', {
          guildName: message.guild?.name,
          channelName: message.channel.name || message.channel.id,
          content: finalMsg.content
        });
      }

      log(`Cached deleted message from ${finalMsg.author.tag} (total: ${channelMessages.length})`, "debug");
    } catch (error) {
      log(`Error in messageDelete event: ${error.message}`, "error");
      console.error("Full error:", error);
    }
  },
};
