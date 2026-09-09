import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { THEME } from "../../utils/theme.js";
import { formatHeaderTitle, formatAnsiBlock, formatAnsiBlocks } from "../../utils/functions.js";

const DATA_PATH = resolve('./data/aireply.json');

function loadData() {
  try {
    if (!existsSync(DATA_PATH)) return { accounts: {}, conversations: {} };
    return JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
  } catch {
    return { accounts: {}, conversations: {} };
  }
}

function saveData(data) {
  try {
    writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
  } catch {}
}

export default {
  name: 'aireply',
  description: 'Toggle automatic AI replies',
  aliases: ['aimode', 'autoreply'],
  usage: '[on | off | clear]',
  category: 'main',
  type: 'both',
  permissions: [],
  cooldown: 5,
  ownerOnly: true,
  async execute(client, message, args) {
    await message.delete().catch(() => {});

    const sub = args[0]?.toLowerCase();
    const prefix = client.prefix;
    const data = loadData();
    const accountId = client.user.id;
    const isEnabled = data.accounts?.[accountId] || false;

    if (sub && ['help', '--help', '-h'].includes(sub)) {
      return message.channel.send(formatReplyMenu(prefix, isEnabled, Object.keys(data.conversations || {}).length));
    }

    if (sub === 'on') {
      if (!data.accounts) data.accounts = {};
      data.accounts[accountId] = true;
      saveData(data);
      const confirm = await message.channel.send(formatThreeBlock(
        'Barro AI Reply',
<<<<<<< HEAD
        [['Status', 'ON']],
        [['Result', 'AI Reply enabled for this account.'], ['Usage', `Use ${prefix}aireply off to disable.`]]
=======
        [[style('Status', '0;30'), style('ON', '0;97')]],
        [[style('Result', '0;30'), style('AI Reply enabled.', '0;97')], [style('Usage', '0;30'), style('Use ,aireply off to disable.', '0;97')]]
>>>>>>> origin/main
      ));
      setTimeout(() => confirm.delete().catch(() => {}), 1000);
      return;
    }

    if (sub === 'off') {
<<<<<<< HEAD
      if (!data.accounts) data.accounts = {};
      data.accounts[accountId] = false;
      saveData(data);
      const confirm = await message.channel.send(formatThreeBlock(
        'Barro AI Reply',
        [['Status', 'OFF']],
        [['Result', 'AI Reply disabled for this account.']]
=======
      data.enabled = false;
      saveData(data);
      const confirm = await message.channel.send(formatThreeBlock(
        'Barro AI Reply',
        [[style('Status', '0;30'), style('OFF', '0;97')]],
        [[style('Result', '0;30'), style('AI Reply disabled.', '0;97')]]
>>>>>>> origin/main
      ));
      setTimeout(() => confirm.delete().catch(() => {}), 1000);
      return;
    }

    if (sub === 'clear') {
      data.conversations = {};
      saveData(data);
      const confirm = await message.channel.send(formatThreeBlock(
        'Barro AI Reply',
<<<<<<< HEAD
        [['Status', isEnabled ? 'ON' : 'OFF']],
        [['Result', 'All conversation history cleared.']]
=======
        [[style('Status', '0;30'), style(data.enabled ? 'ON' : 'OFF', '0;97')]],
        [[style('Result', '0;30'), style('All conversation history cleared.', '0;97')]]
>>>>>>> origin/main
      ));
      setTimeout(() => confirm.delete().catch(() => {}), 1000);
      return;
    }

<<<<<<< HEAD
    return message.channel.send(formatReplyMenu(prefix, isEnabled, Object.keys(data.conversations || {}).length));
=======
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
>>>>>>> origin/main
  }
};

function style(text, colorCode) {
  return `\u001b[${colorCode}m${text}\u001b[0m`;
}

<<<<<<< HEAD
function formatReplyMenu(prefix, isEnabled, conversationCount) {
  const header = formatAnsiBlock([
    formatHeaderTitle('Barro AI Reply Menu')
  ]);
  const commands = formatAnsiBlock([
    style('Sub-commands', THEME.HEADER_BOLD_COLOR),
    style(`${prefix}aireply on`, THEME.LABEL_COLOR) + style(' | Enable automatic AI replies', THEME.ACCENT_COLOR),
    style(`${prefix}aireply off`, THEME.LABEL_COLOR) + style(' | Disable automatic AI replies', THEME.ACCENT_COLOR),
    style(`${prefix}aireply clear`, THEME.LABEL_COLOR) + style(' | Clear conversation history', THEME.ACCENT_COLOR),
    style(`${prefix}aireply help`, THEME.LABEL_COLOR) + style(' | Show this menu', THEME.ACCENT_COLOR)
  ]);
  const status = formatAnsiBlock([
    style('Status', THEME.HEADER_BOLD_COLOR),
    style('Enabled:', THEME.LABEL_COLOR) + style(isEnabled ? ' ON' : ' OFF', THEME.ACCENT_COLOR),
    style('Tracked:', THEME.LABEL_COLOR) + style(` ${conversationCount}`, THEME.ACCENT_COLOR),
    style('Identity:', THEME.LABEL_COLOR) + style(' Acts like the connected account and does not disclose AI involvement.', THEME.ACCENT_COLOR)
  ]);
  return formatAnsiBlocks([
    header,
    commands,
    status
  ]);
=======
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
>>>>>>> origin/main
}
