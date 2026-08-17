import { log } from "../../utils/functions.js";

export default {
  name: "snipe",
  description: "Get the last deleted message in a channel",
  aliases: ["s", "deletesnipe"],
  usage: "",
  category: "main",
  type: "both",
  permissions: [],
  cooldown: 10,
  execute: async (client, message, args) => {
    try {
      if (message.author.id !== client.user.id) return;
      let targetChannel = message.channel;
      if (args[0] && !isNaN(args[0])) {
        const channel = client.channels.cache.get(args[0]);
        if (channel) targetChannel = channel;
      }

      const deletedMessages = client._deletedMessages || new Map();
      if (!deletedMessages.has(targetChannel.id)) {
        return message.channel.send(formatThreeBlock("Barro Snipe", [["Channel", targetChannel.id]], [["Result", "No recently deleted messages found here!"]]));
      }

      const deletedMessage = deletedMessages.get(targetChannel.id);
      const timestamp = new Date(deletedMessage.timestamp).toLocaleString();
      const rows = [
        ["Author", deletedMessage.author.tag || "Unknown"],
        ["Channel", deletedMessage.channelName || "DM/GC"],
        ["Deleted at", timestamp]
      ];
      if (deletedMessage.content && deletedMessage.content.trim().length > 0) {
        rows.push(["Content", deletedMessage.content.length < 100 ? deletedMessage.content : deletedMessage.content.replace(/\n/g, ' / ')]);
      } else {
        rows.push(["Content", "No text content"]);
      }
      if (deletedMessage.attachments && deletedMessage.attachments.length > 0) {
        rows.push(["Attachments", String(deletedMessage.attachments.length)]);
      }

      await message.channel.send(formatThreeBlock("Barro Snipe", [["Channel", targetChannel.id]], rows));

      if (deletedMessage.attachments && deletedMessage.attachments.length > 0) {
        const imageAttachments = deletedMessage.attachments.filter((att) => att.contentType && att.contentType.startsWith("image/"));
        if (imageAttachments.length > 0) {
          await message.channel.send(formatThreeBlock("Barro Snipe", [["Images", String(imageAttachments.length)]], [["Result", "Deleted images attached below."]]));
          const maxImages = Math.min(imageAttachments.length, 3);
          for (let i = 0; i < maxImages; i++) await message.channel.send(imageAttachments[i].url);
          if (imageAttachments.length > maxImages) {
            await message.channel.send(formatThreeBlock("Barro Snipe", [["Images", String(imageAttachments.length)]], [["Result", `${imageAttachments.length - maxImages} more image(s) not shown`]]));
          }
        }
      }
    } catch (error) {
      log(`Error in snipe command: ${error.message}`, "error");
      message.channel.send(formatThreeBlock("Barro Snipe", [["Status", "Error"]], [["Result", `Error: ${error.message}`]]));
    }
  },
};

function style(text, colorCode) {
  return `\u001b[${colorCode}m${text}\u001b[0m`;
}

function formatAnsiBlock(lines) {
  return ["> ```ansi", ...lines.map(line => `> ${line}`), "> ```"].join("\n");
}

function formatThreeBlock(title, block2Rows, block3Rows) {
  const clean = (value) => String(value).replace(/\u001b\[[0-9;]*m/g, '');
  const width = [...block2Rows, ...block3Rows].reduce((max, [label]) => Math.max(max, clean(label).length), 0);
  const renderRows = (rows) => rows.map(([label, value]) => style(clean(label).padEnd(width, ' '), '0;97') + style(' | ', '0;30') + style(clean(value), '0;34'));
  return [formatAnsiBlock([style(title, '0;30')]), formatAnsiBlock(renderRows(block2Rows)), formatAnsiBlock(renderRows(block3Rows))].join('\n');
}
