import { log } from "../../utils/functions.js";

export default {
  name: "editsnipe",
  description: "Get the last edited message in a channel",
  aliases: ["es", "esnipe"],
  usage: "",
  category: "main",
  type: "both",
  permissions: [],
  cooldown: 10,

  execute: async (client, message, args) => {
    try {
      if (message.author.id !== client.user.id) return;

      // Determine which channel to snipe from
      let targetChannel = message.channel;

      // If a channel ID is provided
      if (args[0] && !isNaN(args[0])) {
        const channel = client.channels.cache.get(args[0]);
        if (channel) {
          targetChannel = channel;
        }
      }

      const editedMessages = client._editedMessages || new Map();

      log(
        `Editsnipe command executed. Cache has ${editedMessages.size} entries.`,
        "debug"
      );
      log(`Looking for messages in channel: ${targetChannel.id}`, "debug");

      const editedMessage = editedMessages.get(targetChannel.id);

      if (!editedMessage) {
        return message.channel.send(formatAnsiBlock([
          style('[ EDIT SNIPE ]', '1;30'),
          '',
          style('ERROR:', '1;31') + ' ' + style('No recently edited messages found here!', '0;97')
        ]));
      }

      log(`Found edited message from ${editedMessage.author.tag}`, "debug");

      const timestamp = new Date(editedMessage.timestamp).toLocaleString();

      // Build editsnipe message
      const lines = [
        style('[ EDIT SNIPE ]', '1;30'),
        '',
        style('EDITED MESSAGE:', '1;31'),
        '  Author: ' + (editedMessage.author.tag || 'Unknown'),
      ];

      // Show channel differently based on type
      if (editedMessage.channelName) {
        lines.push('  Channel: ' + editedMessage.channelName);
      } else {
        lines.push('  Channel: DM/GC');
      }

      lines.push('  Edited at: ' + timestamp);

      // Add message link only if in a server
      if (editedMessage.messageId && editedMessage.guildId) {
        lines.push('  Message Link: https://discord.com/channels/' + editedMessage.guildId + '/' + targetChannel.id + '/' + editedMessage.messageId);
      }

      // Before content
      if (editedMessage.oldContent && editedMessage.oldContent.trim().length > 0) {
        if (editedMessage.oldContent.length < 100) {
          lines.push(style('Before:', '1;31') + ' ' + editedMessage.oldContent);
        } else {
          lines.push(style('Before:', '1;31'));
          lines.push(...editedMessage.oldContent.split('\n'));
        }
      } else {
        lines.push(style('Before:', '1;31') + ' *No content*');
      }

      // After content
      if (editedMessage.newContent && editedMessage.newContent.trim().length > 0) {
        if (editedMessage.newContent.length < 100) {
          lines.push(style('After:', '1;31') + ' ' + editedMessage.newContent);
        } else {
          lines.push(style('After:', '1;31'));
          lines.push(...editedMessage.newContent.split('\n'));
        }
      } else {
        lines.push(style('After:', '1;31') + ' *No content*');
      }

      await message.channel.send(formatAnsiBlock(lines));

      log(`Sniped an edited message in ${targetChannel.id}`, "debug");

    } catch (error) {
      log(`Error in editsnipe command: ${error.message}`, "error");
      message.channel.send(formatAnsiBlock([
        style('[ EDIT SNIPE ]', '1;30'),
        '',
        style('ERROR:', '1;31') + ' ' + style(`Error: ${error.message}`, '0;97')
      ]));
    }
  },
};