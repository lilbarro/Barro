import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { THEME } from '../../utils/theme.js';
import { formatHeaderTitle } from '../../utils/functions.js';

const DATA_PATH = resolve('./data/ollamareply.json');

function loadData() {
  try {
    if (!existsSync(DATA_PATH)) return { enabled: false };
    return JSON.parse(readFileSync(DATA_PATH, 'utf8'));
  } catch {
    return { enabled: false };
  }
}

function saveData(data) {
  try {
    writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
  } catch {}
}

export default {
  name: 'aidoom',
  description: 'Uncensored AI reply',
  aliases: ['ad', 'ollama', 'localreply'],
  usage: '[on | off]',
  category: 'ai',
  type: 'both',
  permissions: [],
  cooldown: 5,
  async execute(client, message, args) {
    await message.delete().catch(() => {});

    const data = loadData();
    const sub = args[0]?.toLowerCase();

    if (sub === 'on') data.enabled = true;
    if (sub === 'off') data.enabled = false;

    if (sub === 'on' || sub === 'off') {
      saveData(data);
      const confirmation = await message.channel.send(formatThreeBlock(
        'Uncensored Reply',
        [['Status', data.enabled ? 'ON' : 'OFF']],
        [['Result', data.enabled ? 'Uncensored AI replies enabled.' : 'Uncensored AI replies disabled.'], ['Model', client.config?.ai?.ollama?.model || 'not configured']]
      ));
      setTimeout(() => confirmation.delete().catch(() => {}), 1500);
      return;
    }

    return message.channel.send(formatThreeBlock(
      'Uncensored Reply',
      [['Status', data.enabled ? 'ON' : 'OFF']],
      [['Model', client.config?.ai?.ollama?.model || 'not configured'], ['Commands', `${client.prefix}aiDoom on | ${client.prefix}aiDoom off`]]
    ));
  }
};

function style(text, colorCode) {
  return `\u001b[${colorCode}m${text}\u001b[0m`;
}

function formatAnsiBlocks(blocks) {
  const [firstBlock, ...remainingBlocks] = blocks;
  const output = ['> ```ansi', ...firstBlock.map(line => `> ${line}`)];
  remainingBlocks.forEach(block => output.push('> ``````ansi', ...block.map(line => `> ${line}`)));
  output.push('> ```');
  return output.join('\n');
}

function formatThreeBlock(title, statusRows, detailRows) {
  const rows = [...statusRows, ...detailRows];
  const width = rows.reduce((max, [label]) => Math.max(max, String(label).length), 0);
  const render = (items) => items.map(([label, value]) => {
    const padded = String(label).padEnd(width, ' ');
    return style(padded, THEME.LABEL_COLOR) + style(' | ', THEME.DIVIDER_COLOR) + style(String(value), THEME.ACCENT_COLOR);
  });
  return formatAnsiBlocks([[formatHeaderTitle(title)], render(statusRows), render(detailRows)]);
}
