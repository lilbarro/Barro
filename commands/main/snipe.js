import { log } from "../../utils/functions.js";
import { formatHeaderTitle } from "../../utils/functions.js";
import { THEME } from "../../utils/theme.js";

export default {
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
  return ['> ```ansi', ...lines.map(line => `> ${line}`), '> ```'].join('\n');
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
