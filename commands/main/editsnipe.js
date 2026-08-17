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

      let targetChannel = message.channel;
      if (args[0] && !isNaN(args[0])) {
        const channel = client.channels.cache.get(args[0]);
        if (channel) targetChannel = channel;
      }

      const editedMessages = client._editedMessages || new Map();
      const editedMessage = editedMessages.get(targetChannel.id);

      if (!editedMessage) {
        return message.channel.send(formatThreeBlock("Barro Editsnipe", [["Channel", targetChannel.id]], [["Result", "No recently edited messages found here!"]]));
      }

      const rows = [
        ["Author", editedMessage.author.tag || "Unknown"],
        ["Channel", editedMessage.channelName || "DM/GC"],
        ["Edited at", new Date(editedMessage.timestamp).toLocaleString()]
      ];
      if (editedMessage.messageId && editedMessage.guildId) {
        rows.push(["Message Link", `https://discord.com/channels/${editedMessage.guildId}/${targetChannel.id}/${editedMessage.messageId}`]);
      }
      if (editedMessage.oldContent && editedMessage.oldContent.trim().length > 0) {
        rows.push(["Before", editedMessage.oldContent.length < 100 ? editedMessage.oldContent : editedMessage.oldContent.replace(/\n/g, ' / ')]);
      } else {
        rows.push(["Before", "No content"]);
      }
      if (editedMessage.newContent && editedMessage.newContent.trim().length > 0) {
        rows.push(["After", editedMessage.newContent.length < 100 ? editedMessage.newContent : editedMessage.newContent.replace(/\n/g, ' / ')]);
      } else {
        rows.push(["After", "No content"]);
      }

      await message.channel.send(formatThreeBlock("Barro Editsnipe", [["Channel", targetChannel.id]], rows));
      log(`Sniped an edited message in ${targetChannel.id}`, "debug");
    } catch (error) {
      log(`Error in editsnipe command: ${error.message}`, "error");
      message.channel.send(formatThreeBlock("Barro Editsnipe", [["Status", "Error"]], [["Result", `Error: ${error.message}`]]));
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
