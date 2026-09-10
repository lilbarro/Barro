import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { THEME } from '../../utils/theme.js';
import { formatHeaderTitle, formatAnsiBlocks } from '../../utils/functions.js';

const PFP_PATH = resolve('./data/pfphistory.json');
const NAME_PATH = resolve('./data/namehistory.json');
const BANNER_PATH = resolve('./data/bannerhistory.json');

function loadJSON(filePath) {
  try { return existsSync(filePath) ? JSON.parse(readFileSync(filePath, 'utf8')) : {}; } catch { return {}; }
}
function style(text, color) { return `\u001b[${color}m${text}\u001b[0m`; }
function kv(label, value) { return style(String(label).padEnd(12, ' '), '37') + style(' | ', '0;30') + style(String(value), THEME.ACCENT_COLOR); }
function report(target) {
  const pfp = loadJSON(PFP_PATH)[target.id] || [];
  const names = loadJSON(NAME_PATH)[target.id] || [];
  const banners = loadJSON(BANNER_PATH)[target.id] || [];
  return formatAnsiBlocks([
    [formatHeaderTitle('Barro OSINT')],
    [
      style('Target', THEME.HEADER_BOLD_COLOR),
      kv('Name', target.username || target.tag || 'Unknown'),
      kv('ID', target.id),
      kv('Created', target.createdTimestamp ? new Date(target.createdTimestamp).toLocaleDateString() : 'Unknown')
    ],
    [
      style('History', THEME.HEADER_BOLD_COLOR),
      kv('Avatars', pfp.length),
      kv('Names', names.length),
      kv('Banners', banners.length)
    ]
  ]);
}

export default {
  name: 'osint',
  description: 'Scan public user information',
  aliases: ['scan', 'investigate'],
  usage: '[user id]',
  category: 'troll',
  type: 'both',
  permissions: [],
  cooldown: 1,
  async execute(client, message, args) {
    if (args[0] && ['help', '--help', '-h'].includes(args[0].toLowerCase())) {
      return message.channel.send(formatAnsiBlocks([
        [formatHeaderTitle('Barro OSINT')],
        [style('Usage', THEME.HEADER_BOLD_COLOR), style(`${client.prefix}osint [user/id]`, THEME.ACCENT_COLOR)],
        [style('Aliases', THEME.HEADER_BOLD_COLOR), style(`${client.prefix}scan | ${client.prefix}investigate`, THEME.ACCENT_COLOR)]
      ]));
    }
    try {
      const target = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]) : message.author);
      return message.channel.send(report(target));
    } catch (error) {
      return message.channel.send(formatAnsiBlocks([
        [formatHeaderTitle('Barro OSINT')],
        [style('ERROR:', THEME.LABEL_COLOR) + style(` ${error.message}`, THEME.ACCENT_COLOR)]
      ]));
    }
  }
};
