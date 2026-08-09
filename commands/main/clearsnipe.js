import { log } from "../../utils/functions.js";

export default {
  name: "clearsnipe",
  description: "Clear the snipe cache for all channels or a specific channel",
  aliases: ["cs", "clearsnipes"],
  usage: "[channel]",
  category: "server",
  type: "both",
  permissions: ["SendMessages"],
  cooldown: 3,

  execute: async (client, message, args) => {
    try {
      if (message.author.id !== client.user.id) return;

      // Initialize caches if they don't exist
      if (!client._deletedMessages) client._deletedMessages = new Map();
      if (!client._editedMessages) client._editedMessages = new Map();

      // Check if a specific channel is mentioned
      if (message.mentions.channels.size > 0) {
        const targetChannel = message.mentions.channels.first();

        // Clear only the specified channel
        client._deletedMessages.delete(targetChannel.id);
        client._editedMessages.delete(targetChannel.id);

        await message.channel.send(
          `> ✅ Cleared snipe cache for channel <#${targetChannel.id}>.`
        );
        log(
          `Cleared snipe cache for channel #${
            targetChannel.name || targetChannel.id
          }`,
          "debug"
        );
      }
      // Check if a channel ID is provided
      else if (args[0] && !isNaN(args[0])) {
        const channelId = args[0];
        const channel =
          message.guild?.channels.cache.get(channelId) ||
          client.channels.cache.get(channelId);

        if (channel) {
          // Clear only the specified channel
          client._deletedMessages.delete(channelId);
          client._editedMessages.delete(channelId);

          await message.channel.send(
            `> ✅ Cleared snipe cache for channel <#${channelId}>.`
          );
          log(
            `Cleared snipe cache for channel #${channel.name || channelId}`,
            "debug"
          );
        } else {
          await message.channel.send(
            "> ❌ Could not find the specified channel."
          );
        }
      }
      // If no channel is specified, clear all caches
      else {
        // Clear all cached messages
        client._deletedMessages.clear();
        client._editedMessages.clear();

        await message.channel.send(
          "> ✅ Cleared snipe cache for all channels."
        );
        log("Cleared snipe cache for all channels", "debug");
      }
    } catch (error) {
      log(`Error in clearsnipe command: ${error.message}`, "error");
      message.channel.send(
        `> ❌ An error occurred while clearing the snipe cache: ${error.message}`
      );
    }
  },
};
