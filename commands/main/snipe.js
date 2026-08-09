import { log } from "../../utils/functions.js";

export default {
  name: "snipe",
  description: "Get the last deleted message in a channel",
  aliases: ["s", "deletesnipe"],
  usage: "",
  category: "main",
  type: "both",
  permissions: [],
  cooldown: 3,

  execute: async (client, message, args) => {
    try {
      if (message.author.id !== client.user.id) return;

      let targetChannel = message.channel;

      // If a channel ID is provided
      if (args[0] && !isNaN(args[0])) {
        const channel = client.channels.cache.get(args[0]);
        if (channel) {
          targetChannel = channel;
        }
      }

      const deletedMessages = client._deletedMessages || new Map();

      if (!deletedMessages.has(targetChannel.id)) {
        return message.channel.send(formatAnsiBlock([
          style('[ SNIPE ]', '1;30'),
          '',
          style('ERROR:', '1;31') + ' ' + style('No recently deleted messages found here!', '0;97')
        ]));
      }

      const deletedMessage = deletedMessages.get(targetChannel.id);
      const timestamp = new Date(deletedMessage.timestamp).toLocaleString();

      const lines = [
        style('[ SNIPE ]', '1;30'),
        '',
        style('DELETED MESSAGE:', '1;31'),
        '  Author: ' + (deletedMessage.author.tag || 'Unknown'),
        '  Channel: ' + (deletedMessage.channelName || 'DM/GC'),
        '  Deleted at: ' + timestamp
      ];

      if (deletedMessage.content && deletedMessage.content.trim().length > 0) {
        if (deletedMessage.content.length < 100) {
          lines.push(style('Content:', '1;31') + ' ' + deletedMessage.content);
        } else {
          lines.push(style('Content:', '1;31'));
          lines.push(...deletedMessage.content.split('\n'));
        }
      } else {
        lines.push(style('Content:', '1;31') + ' *No text content*');
      }

      if (deletedMessage.attachments && deletedMessage.attachments.length > 0) {
        lines.push(style('Attachments:', '1;31'));
        deletedMessage.attachments.forEach((att, index) => {
          lines.push(`  ${index + 1}. ${att.name}: ${att.url}`);
        });
      }

      await message.channel.send(formatAnsiBlock(lines));

      // Send images separately
      if (deletedMessage.attachments && deletedMessage.attachments.length > 0) {
        const imageAttachments = deletedMessage.attachments.filter(
          (att) => att.contentType && att.contentType.startsWith("image/")
        );

        if (imageAttachments.length > 0) {
          await message.channel.send(formatAnsiBlock([
            style('[ SNIPE ]', '1;30'),
            '',
            style('IMAGES:', '1;31') + ' ' + style('Deleted Images:', '0;97')
          ]));
          const maxImages = Math.min(imageAttachments.length, 3);
          for (let i = 0; i < maxImages; i++) {
            await message.channel.send(imageAttachments[i].url);
          }
          if (imageAttachments.length > maxImages) {
            await message.channel.send(formatAnsiBlock([
              style('[ SNIPE ]', '1;30'),
              '',
              style('INFO:', '1;31') + ' ' + style(`${imageAttachments.length - maxImages} more image(s) not shown`, '0;97')
            ]));
          }
        }
      }

    } catch (error) {
      log(`Error in snipe command: ${error.message}`, "error");
      message.channel.send(formatAnsiBlock([
        style('[ SNIPE ]', '1;30'),
        '',
        style('ERROR:', '1;31') + ' ' + style(`Error: ${error.message}`, '0;97')
      ]));
    }
  },
};

function style(text, colorCode) {
  return `\u001b[${colorCode}m${text}\u001b[0m`;
}

function formatAnsiBlock(lines) {
  return ['> ```ansi', ...lines.map(line => `> ${line}`), '> ```'].join('\n');
}
