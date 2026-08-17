import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const DATA_PATH = resolve('./data/aireply.json');

function loadData() {
  try {
    if (!existsSync(DATA_PATH)) return { enabled: false, conversations: {} };
    return JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
  } catch {
    return { enabled: false, conversations: {} };
  }
}

function saveData(data) {
  try {
    writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
  } catch {}
}

export default {
  name: 'aireply',
  description: 'Toggle AI auto reply for DMs, GCs and server mentions.',
  aliases: ['aimode', 'autoreply'],
  usage: '[on | off | clear]',
  category: 'main',
  type: 'both',
  permissions: [],
  cooldown: 5,
  async execute(client, message, args) {
    await message.delete().catch(() => {});

    const sub = args[0]?.toLowerCase();
    const data = loadData();

    if (sub === 'on') {
      data.enabled = true;
      saveData(data);
      const confirm = await message.channel.send(formatThreeBlock(
        'Barro AI Reply',
        [[style('Status', '0;30'), style('ON', '0;97')]],
        [[style('Result', '0;30'), style('AI Reply enabled.', '0;97')], [style('Usage', '0;30'), style('Use ,aireply off to disable.', '0;97')]]
      ));
      setTimeout(() => confirm.delete().catch(() => {}), 1000);
      return;
    }

    if (sub === 'off') {
      data.enabled = false;
      saveData(data);
      const confirm = await message.channel.send(formatThreeBlock(
        'Barro AI Reply',
        [[style('Status', '0;30'), style('OFF', '0;97')]],
        [[style('Result', '0;30'), style('AI Reply disabled.', '0;97')]]
      ));
      setTimeout(() => confirm.delete().catch(() => {}), 1000);
      return;
    }

    if (sub === 'clear') {
      data.conversations = {};
      saveData(data);
      const confirm = await message.channel.send(formatThreeBlock(
        'Barro AI Reply',
        [[style('Status', '0;30'), style(data.enabled ? 'ON' : 'OFF', '0;97')]],
        [[style('Result', '0;30'), style('All conversation history cleared.', '0;97')]]
      ));
      setTimeout(() => confirm.delete().catch(() => {}), 1000);
      return;
    }

    const convCount = Object.keys(data.conversations || {}).length;
    return message.channel.send(formatThreeBlock(
      'Barro AI Reply',
      [
        [style('Status', '0;30'), style(data.enabled ? 'ON' : 'OFF', '0;97')],
        [style('Tracked', '0;30'), style(String(convCount), '0;97')]
      ],
      [
        [style('Commands', '0;30'), style(',aireply on | ,aireply off | ,aireply clear', '0;97')]
      ]
    ));
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
