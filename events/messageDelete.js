import { log } from "../utils/functions.js";
import StalkManager from "../utils/StalkManager.js";

export default {
  name: "messageDelete",
  once: false,

  execute: async (client, message) => {
    try {
      // Initialize cache if not exists
      if (!client._deletedMessages) {
        client._deletedMessages = new Map();
        log("Initialized deleted messages cache", "debug");
      }

      // Skip invalid messages
      if (!message || !message.author) {
        log("Skipping invalid message in messageDelete event", "debug");
        return;
      }

      // Skip bot messages
      if (message.author.bot) {
        log(`Skipping bot message from ${message.author.tag}`, "debug");
        return;
      }

      // ⚠️ REMOVED the skip own message check so DMs and GCs work
      // In DMs/GCs you ARE the author so we need to cache these too

      log(
        `Processing deleted message from ${message.author.tag} in ${
          message.channel.name || message.channel.id
        }`,
        "debug"
      );

      // Store deleted message in cache
      client._deletedMessages.set(message.channel.id, {
        content: message.content || "",
        author: {
          id: message.author.id,
          tag: message.author.tag,
          displayAvatarURL: message.author.displayAvatarURL
            ? message.author.displayAvatarURL()
            : null,
        },
        timestamp: Date.now(),
        attachments: message.attachments
          ? [...message.attachments.values()].map((att) => ({
              name: att.name || "attachment",
              url: att.url || att.proxyURL,
              contentType: att.contentType || "unknown",
              size: att.size || 0,
            }))
          : [],
        // Store channel type so snipe knows where it came from
        channelType: message.channel.type,
        // Store guild info if available
        guildName: message.guild?.name || null,
        channelName: message.channel.name || null,
      });

      // Handle stalk logging
      if (StalkManager.isStalking(message.author.id)) {
        StalkManager.logMessageEvent(message.author.id, 'MESSAGE_DELETED', {
          guildName: message.guild?.name,
          channelName: message.channel.name || message.channel.id,
          content: message.content
        });
      }

      log(
        `Cached deleted message from ${message.author.tag} in ${
          message.channel.name || message.channel.id
        }`,
        "debug"
      );
      log(`Cache now has ${client._deletedMessages.size} entries`, "debug");

    } catch (error) {
      log(`Error in messageDelete event: ${error.message}`, "error");
      console.error("Full error:", error);
    }
  },
};