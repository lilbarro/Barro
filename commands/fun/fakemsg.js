import axios from 'axios';
import fs from 'fs';

export default {
  name: 'fakemsg',
  description: 'Send a fake message.',
  aliases: ['fake'],
  usage: '@user <text>',
  category: 'general',
  type: 'both',
  permissions: ['SendMessages', 'AttachFiles'],
  cooldown: 30,

  execute: async (client, message, args) => {
    const user = message.mentions.users.first();
    const text = args.slice(1).join(' ');

    if (!user || !text) {
      return message.channel.send(formatThreeBlock(
        'Barro Fakemsg',
        [[style('Target', '0;30'), style('Unknown', '0;97')]],
        [[style('Usage', '0;30'), style(`${client.prefix}fakemsg @user <message>`, '0;97')]]
      ));
    }

    try {
      const response = await axios.get(`https://benny.fun/api/discordmessage?avatar_url=${encodeURIComponent(user.avatarURL())}&username=${encodeURIComponent(user.username)}&text=${encodeURIComponent(text)}`, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);
      const filePath = './fakemsg.png';
      fs.writeFileSync(filePath, buffer);
      await message.channel.send(formatThreeBlock(
        'Barro Fakemsg',
        [[style('Target', '0;30'), style(user.username, '0;97')]],
        [[style('Result', '0;30'), style('Fake message sent as an image.', '0;97')]]
      ));
      await message.channel.send({ files: [filePath] });
      fs.unlinkSync(filePath);
    } catch (error) {
      message.channel.send(formatThreeBlock(
        'Barro Fakemsg',
        [[style('Target', '0;30'), style(user?.username || 'Unknown', '0;97')]],
        [[style('Result', '0;30'), style(`Failed to send fake message: ${error.message}`, '0;97')]]
      ));
    }
  }
};

function style(text, colorCode) {
  return `\u001b[${colorCode}m${text}\u001b[0m`;
}

function formatAnsiBlock(lines) {
  return ['> ```ansi', ...lines.map(line => `> ${line}`), '> ```'].join('\n');
}

function formatThreeBlock(title, block2Rows, block3Rows) {
  const clean = (value) => String(value).replace(/\u001b\[[0-9;]*m/g, '');
  const width = [...block2Rows, ...block3Rows].reduce((max, [label]) => Math.max(max, clean(label).length), 0);
  const renderRows = (rows) => rows.map(([label, value]) => {
    const left = clean(label).padEnd(width, ' ');
    return style(left, '0;97') + style(' | ', '0;30') + style(clean(value), '0;34');
  });
  return [
    formatAnsiBlock([style(title, '0;30')]),
    formatAnsiBlock(renderRows(block2Rows)),
    formatAnsiBlock(renderRows(block3Rows))
  ].join('\n');
}
