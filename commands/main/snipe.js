import { log } from "../../utils/functions.js";
import { formatHeaderTitle } from "../../utils/functions.js";
import { THEME } from "../../utils/theme.js";

export default {
<<<<<<< HEAD
  name: 'snipe',
  description: 'Show recently deleted messages',
  aliases: ['lastdeleted', 'undeletemsg', 's'],
  usage: '[number]',
  category: 'main',
  type: 'both',
  permissions: ['SendMessages'],
  cooldown: 5,

  async execute(client, message, args) {
    try {
      if (args[0] && ['help', '--help', '-h'].includes(args[0].toLowerCase())) {
        return message.channel.send(`> **Snipe Help**\n> Usage: \`${client.prefix}snipe [number]\`\n> Aliases: ${client.prefix}lastdeleted, ${client.prefix}undeletemsg, ${client.prefix}s`);
      }
      if (!client._deletedMessages) {
        return message.channel.send(formatAnsiBlock([
          formatHeaderTitle('Barro Snipe'),
          '',
          ...formatThreeBlockRows([['Status', 'Error']], [['Result', 'No deleted messages cache found.']])
        ]));
      }

      const channelId = message.channel.id;
      const deletedMessages = client._deletedMessages.get(channelId);

      if (!deletedMessages || deletedMessages.length === 0) {
        return message.channel.send(formatAnsiBlock([
          formatHeaderTitle('Barro Snipe'),
          '',
          ...formatThreeBlockRows([['Status', 'Not Found']], [['Result', 'No recently deleted messages in this channel.']])
        ]));
      }

      // Filter out only the bot's own messages
      const filteredMessages = deletedMessages.filter(msg => msg.author.id !== client.user.id);

      if (filteredMessages.length === 0) {
        return message.channel.send(formatAnsiBlock([
          formatHeaderTitle('Barro Snipe'),
          '',
          ...formatThreeBlockRows([['Status', 'Not Found']], [['Result', 'No deleted messages from non-owners in this channel.']])
        ]));
      }

      // Parse the optional number argument
      let messageIndex = 0; // Default to most recent (index 0)
      if (args.length > 0) {
        const num = parseInt(args[0], 10);
        if (!isNaN(num) && num >= 1) {
          messageIndex = num - 1; // Convert 1-based to 0-based
        }
      }

      // Check if the requested index exists
      if (messageIndex >= filteredMessages.length) {
        return message.channel.send(formatAnsiBlock([
          formatHeaderTitle('Barro Snipe'),
          '',
          ...formatThreeBlockRows([['Status', 'Not Found']], [['Result', `Only ${filteredMessages.length} deleted message(s) available. Use a number between 1 and ${filteredMessages.length}.`]])
        ]));
      }

      const deletedMsg = filteredMessages[messageIndex];

      const timeAgo = getTimeAgo(deletedMsg.timestamp);
      const attachmentCount = deletedMsg.attachments?.size || 0;
      const messageNumber = messageIndex + 1;
      const totalMessages = filteredMessages.length;

      const contentPreview = deletedMsg.content ?
        deletedMsg.content :
        'No text content';

      const rows = [
        ['Message', `${messageNumber}/${totalMessages}`],
        ['Author', deletedMsg.author.tag],
        ['Deleted', timeAgo],
        ['Attachments', attachmentCount > 0 ? `${attachmentCount} file(s)` : 'None'],
        ['Channel Type', deletedMsg.channelType || 'Unknown']
      ];

      if (deletedMsg.guildName) {
        rows.push(['Server', deletedMsg.guildName]);
      }
      if (deletedMsg.channelName) {
        rows.push(['Channel', deletedMsg.channelName]);
      }

      // Create the main details block
      const detailsLines = [
        formatHeaderTitle(`Barro Snipe - Deleted Message #${messageNumber}`),
        '',
        ...formatThreeBlockRows([], rows)
      ];
      const responseBlocks = [detailsLines];
      if (contentPreview !== 'No text content') {
        responseBlocks.push([
          style('Message Content', THEME.HEADER_BOLD_COLOR),
          style('─'.repeat(20), THEME.DIVIDER_COLOR),
          style(contentPreview, THEME.ACCENT_COLOR)
        ]);
      }

      return message.channel.send(formatAnsiBlocks(responseBlocks));
    } catch (error) {
      log(`Error in snipe command: ${error.message}`, 'error');
      return message.channel.send(formatAnsiBlock([
        formatHeaderTitle('Barro Snipe'),
        '',
        style('Status', THEME.LABEL_COLOR) + style(' | ', THEME.DIVIDER_COLOR) + style('Error', THEME.ACCENT_COLOR),
        style('Result', THEME.LABEL_COLOR) + style(' | ', THEME.DIVIDER_COLOR) + style(`Failed to retrieve deleted message: ${error.message}`, THEME.ACCENT_COLOR)
      ]));
=======
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
>>>>>>> origin/main
    }
  }
};

function style(text, colorCode) {
  if (String(text).startsWith('Barro') && colorCode === THEME.HEADER_BOLD_COLOR) {
    return `\u001b[${THEME.HEADER_COLOR}mBarro\u001b[0m` + `\u001b[${THEME.ACCENT_COLOR}m${String(text).slice(5)}\u001b[0m`;
  }
  return `[${colorCode}m${text}[0m`;
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

function formatAnsiBlocks(blocks) {
  const [firstBlock, ...remainingBlocks] = blocks;
  const output = ['> ```ansi', ...firstBlock.map(line => `> ${line}`)];
  remainingBlocks.forEach(block => output.push('> ``````ansi', ...block.map(line => `> ${line}`)));
  output.push('> ```');
  return output.join('\n');
}

function formatThreeBlockRows(block2Rows, block3Rows) {
  const clean = (value) => String(value).replace(/\[[0-9;]*m/g, '');
  const width = [...block2Rows, ...block3Rows].reduce((max, [label]) => Math.max(max, clean(label).length), 0);
  const renderRows = (rows) => rows.map(([label, value]) => {
    const left = clean(label).padEnd(width, ' ');
    return style(left, THEME.LABEL_COLOR) + style(' | ', THEME.DIVIDER_COLOR) + style(clean(value), THEME.ACCENT_COLOR);
  });

  const finalRows = [];
  if (block2Rows.length) finalRows.push(...renderRows(block2Rows));
  if (block3Rows.length) finalRows.push(...renderRows(block3Rows));
  return finalRows;
}

function getTimeAgo(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day(s) ago`;
  if (hours > 0) return `${hours} hour(s) ago`;
  if (minutes > 0) return `${minutes} minute(s) ago`;
  if (seconds > 0) return `${seconds} second(s) ago`;
  return 'Just now';
}
