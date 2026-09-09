import { log } from "../../utils/functions.js";
import { formatHeaderTitle } from "../../utils/functions.js";
import { THEME } from "../../utils/theme.js";

export default {
  name: 'editsnipe',
  description: 'Show recently edited messages',
  aliases: ['lastedited', 'edits', 'es'],
  usage: '[number]',
  category: 'main',
  type: 'both',
  permissions: ['SendMessages'],
  cooldown: 5,

  async execute(client, message, args) {
    try {
      if (args[0] && ['help', '--help', '-h'].includes(args[0].toLowerCase())) {
        return message.channel.send(`> **EditSnipe Help**\n> Usage: \`${client.prefix}editsnipe [number]\`\n> Aliases: ${client.prefix}lastedited, ${client.prefix}edits, ${client.prefix}es`);
      }
      if (!client._editedMessages) {
        return message.channel.send(formatAnsiBlock([
          formatHeaderTitle('Barro EditSnipe'),
          '',
          ...formatThreeBlockRows([['Status', 'Error']], [['Result', 'No edited messages cache found.']])
        ]));
      }

      const channelId = message.channel.id;
      const editedMessages = client._editedMessages.get(channelId);

      if (!editedMessages || editedMessages.length === 0) {
        return message.channel.send(formatAnsiBlock([
          formatHeaderTitle('Barro EditSnipe'),
          '',
          ...formatThreeBlockRows([['Status', 'Not Found']], [['Result', 'No recently edited messages in this channel.']])
        ]));
      }

      // Filter out only the bot's own messages
      const filteredMessages = editedMessages.filter(msg => msg.author.id !== client.user.id);

      if (filteredMessages.length === 0) {
        return message.channel.send(formatAnsiBlock([
          formatHeaderTitle('Barro EditSnipe'),
          '',
          ...formatThreeBlockRows([['Status', 'Not Found']], [['Result', 'No edited messages from non-bots in this channel.']])
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
          formatHeaderTitle('Barro EditSnipe'),
          '',
          ...formatThreeBlockRows([['Status', 'Not Found']], [['Result', `Only ${filteredMessages.length} edited message(s) available. Use a number between 1 and ${filteredMessages.length}.`]])
        ]));
      }

      const editedMsg = filteredMessages[messageIndex];

      const timeAgo = getTimeAgo(editedMsg.timestamp);
      const messageNumber = messageIndex + 1;
      const totalMessages = filteredMessages.length;

      const oldContentPreview = editedMsg.oldContent ?
        editedMsg.oldContent :
        'No old content';

      const newContentPreview = editedMsg.newContent ?
        editedMsg.newContent :
        'No new content';

      const rows = [
        ['Message', `${messageNumber}/${totalMessages}`],
        ['Author', editedMsg.author.tag],
        ['Edited', timeAgo],
        ['Channel Type', message.channel.type || 'Unknown']
      ];

      if (editedMsg.guildName) {
        rows.push(['Server', editedMsg.guildName]);
      }
      if (editedMsg.channelName) {
        rows.push(['Channel', editedMsg.channelName]);
      }

      // Create the main details block
      const detailsLines = [
        formatHeaderTitle(`Barro EditSnipe - Edited Message #${messageNumber}`),
        '',
        ...formatThreeBlockRows([], rows)
      ];
      const responseBlocks = [detailsLines];
      if (oldContentPreview !== 'No old content' || newContentPreview !== 'No new content') {
        responseBlocks.push([
          style('Content:', THEME.HEADER_BOLD_COLOR),
          '',
          style('Old Text', THEME.LABEL_COLOR) + style(' | ', THEME.DIVIDER_COLOR) + style(oldContentPreview, THEME.ACCENT_COLOR),
          style('New Text', THEME.LABEL_COLOR) + style(' | ', THEME.DIVIDER_COLOR) + style(newContentPreview, THEME.ACCENT_COLOR)
        ]);
      }

      return message.channel.send(formatAnsiBlocks(responseBlocks));
    } catch (error) {
      log(`Error in editsnipe command: ${error.message}`, 'error');
      return message.channel.send(formatAnsiBlock([
        formatHeaderTitle('Barro EditSnipe'),
        '',
        ...formatThreeBlockRows([['Status', 'Error']], [['Result', `Failed to retrieve edited message: ${error.message}`]])
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
