import { log } from "../utils/functions.js";
import StalkManager from "../utils/StalkManager.js";

export default {
  name: "messageUpdate",
  once: false,

  execute: async (client, oldMessage, newMessage) => {
    try {
      // Initialize the edited messages cache if it doesn't exist
      if (!client._editedMessages) {
        client._editedMessages = new Map();
        log("Initialized edited messages cache", "debug");
      }

      // --- CUSTOM CACHE LOOKUP ---
      let cachedOldMsg = null;
      if (client._messageCache && client._messageCache.has(oldMessage.channel.id)) {
        const channelCache = client._messageCache.get(oldMessage.channel.id);
        cachedOldMsg = channelCache.find(m => m.id === oldMessage.id);
      }

      // Use cached version if available to get the original content
      const finalOldMsg = cachedOldMsg || oldMessage;

      // Skip if the message is invalid
      if (!finalOldMsg || !finalOldMsg.author || !newMessage) {
        log("Skipping invalid message in messageUpdate event", "debug");
        return;
      }

      // Skip if the message is from a bot
      if (finalOldMsg.author.bot) {
        log(`Skipping bot message from ${finalOldMsg.author.tag}`, "debug");
        return;
      }

      // Skip if the message is from an OWNER
      const owners = client.config?.owners || [];
      if (owners.includes(finalOldMsg.author.id)) {
        log(`Skipping owner message from ${finalOldMsg.author.tag}`, "debug");
        return;
      }

      // ⚠️ REMOVED own message skip so DMs and GCs work
      // In DMs/GCs you ARE the author so we need to cache these too

      // Skip if content didn't change
      if (finalOldMsg.content === newMessage.content) {
        log("Skipping message update with no content change", "debug");
        return;
      }

      log(
        `Processing edited message from ${finalOldMsg.author.tag} in ${
          finalOldMsg.channelName || oldMessage.channel.name || oldMessage.channel.id
        }`,
        "debug"
      );

      // Store the edited message in the cache
      const editedMessageData = {
        oldContent: finalOldMsg.content || "",
        newContent: newMessage.content || "",
        author: {
          id: finalOldMsg.author.id,
          tag: finalOldMsg.author.tag,
          displayAvatarURL: finalOldMsg.author.displayAvatarURL || (finalOldMsg.author.displayAvatarURL ? finalOldMsg.author.displayAvatarURL() : null),
        },
        timestamp: Date.now(),
        messageId: newMessage.id,
        guildId: newMessage.guild?.id || null,
        channelId: oldMessage.channel.id,
        channelName: finalOldMsg.channelName || oldMessage.channel.name || null,
        guildName: oldMessage.guild?.name || null,
      };

      // Store in array, keeping last 10 messages per channel
      if (!client._editedMessages.has(oldMessage.channel.id)) {
        client._editedMessages.set(oldMessage.channel.id, []);
      }
      const channelMessages = client._editedMessages.get(oldMessage.channel.id);
      channelMessages.unshift(editedMessageData); // Add to beginning
      if (channelMessages.length > 10) {
        channelMessages.pop(); // Remove oldest if more than 10
      }

      // Handle stalk logging for message edited
      if (StalkManager.isStalking(oldMessage.author.id)) {
        StalkManager.logMessageEvent(oldMessage.author.id, 'MESSAGE_EDITED', {
          guildName: oldMessage.guild?.name,
          channelName: oldMessage.channel.name || oldMessage.channel.id,
          oldContent: oldMessage.content,
          newContent: newMessage.content
        });
      }

      log(
        `Cached edited message from ${oldMessage.author.tag} in ${
          oldMessage.channel.name || oldMessage.channel.id
        } (total: ${channelMessages.length})`,
        "debug"
      );

    } catch (error) {
      log(`Error in messageUpdate event: ${error.message}`, "error");
      console.error("Full error:", error);
    }
  },
};