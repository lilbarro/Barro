import { loadConfig, log, formatHeaderTitle, formatAnsiBlocks, style } from "../../utils/functions.js";
import { afkSessions, formatDuration, getMentionLog, clearSession } from "../../utils/aiAfkHandler.js";
import { THEME } from "../../utils/theme.js";
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const SETTINGS_PATH = resolve('./data/aiafk_settings.json');

function loadSettings() {
  try {
    if (!existsSync(SETTINGS_PATH)) return {};
    return JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function saveSettings(settings) {
  try {
    writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
  } catch {}
}

export default {
  name: 'aiafk',
  description: 'Set AI AFK response',
  aliases: ['aiaway'],
  usage: '[enable | disable] [reason]',
  category: 'ai',
  type: 'both',
  permissions: [],
  cooldown: 6,
  ownerOnly: true,
  async execute(client, message, args) {
    const cfg = loadConfig()?.ai_afk;
    const prefix = client.prefix;
    const userId = message.author.id;
    const accountId = client.user.id;
    const sub = args[0]?.toLowerCase();
    await message.delete().catch(() => {});

    const settings = loadSettings();
    const isEnabled = settings[accountId] || false;

    if (!sub) {
      return message.channel.send(formatThreeBlock(
        'Barro AI AFK',
        [
          ['Enable', `\`${prefix}aiafk enable\``],
          ['Reason', `\`${prefix}aiafk enable [reason]\``],
          ['Disable', `\`${prefix}aiafk disable\``],
          ['Status', `\`${prefix}aiafk status\``]
        ],
        [['Info', 'AI AFK commands and controls.']]
      ));
    }

    if (sub === 'enable' || sub === 'on') {
      if (!cfg || !cfg.enabled) {
        return message.channel.send(formatThreeBlock('Barro AI AFK',
          [['Status', 'OFF']],
          [['Result', 'AI AFK is disabled in config.yaml!']]
        ));
      }

      settings[accountId] = true;
      saveSettings(settings);

      if (afkSessions.has(userId)) {
        const session = afkSessions.get(userId);
        const duration = formatDuration(Date.now() - session.startedAt);
        return message.channel.send(formatThreeBlock('Barro AI AFK',
          [['Status', 'ON']],
          [['Result', 'Already active.'], ['Duration', duration]]
        ));
      }

      const reason = args.slice(1).join(' ').trim() || null;
      afkSessions.set(userId, { reason, startedAt: Date.now(), userName: message.member?.displayName || message.author.username });
      log('AI AFK enabled by ' + message.author.username + ' reason: ' + (reason || 'none'), 'debug');
      return message.channel.send(formatThreeBlock(
        'Barro AI AFK',
        [['Status', 'ON'], ['Reason', reason || 'none']],
        [['Result', 'AI AFK enabled.'], ['Info', 'Mentions and DMs will get an AI response.']]
      ));
    }

    if (sub === 'disable' || sub === 'off') {
      settings[accountId] = false;
      saveSettings(settings);

      if (!afkSessions.has(userId)) {
        return message.channel.send(formatThreeBlock('Barro AI AFK',
          [['Status', 'OFF']],
          [['Result', 'AI AFK is not active!']]
        ));
      }

      const session = afkSessions.get(userId);
      const duration = formatDuration(Date.now() - session.startedAt);
      const mentions = getMentionLog(userId);
      clearSession(userId);

      const detailRows = [
        ['Duration', duration],
        ['Messages', String(mentions.length)]
      ];
      if (mentions.length > 0) {
        const uniqueSenders = [...new Set(mentions.map(m => m.senderName))];
        detailRows.push(['Senders', String(uniqueSenders.length)]);
      }

      log('AI AFK disabled by ' + message.author.username, 'debug');
      return message.channel.send(formatThreeBlock(
        'Barro AI AFK',
        [['Status', 'OFF']],
        detailRows
      ));
    }

    if (sub === 'status') {
      if (!afkSessions.has(userId)) {
        return message.channel.send(formatThreeBlock(
          'Barro AI AFK',
          [['Status', isEnabled ? 'ON' : 'OFF']],
          [['Result', isEnabled ? 'AI AFK is enabled for this account but you are not currently away.' : 'AI AFK is currently OFF.']]
        ));
      }
      const session = afkSessions.get(userId);
      const duration = formatDuration(Date.now() - session.startedAt);
      const mentions = getMentionLog(userId);
      return message.channel.send(formatThreeBlock(
        'Barro AI AFK',
        [['Status', 'ON'], ['Reason', session.reason || 'none']],
        [['Duration', duration], ['Messages', String(mentions.length)]]
      ));
    }

    return message.channel.send(formatThreeBlock(
      'Barro AI AFK',
      [['Status', 'Unknown']],
      [['Result', `Unknown subcommand. Use ${prefix}aiafk enable or ${prefix}aiafk disable.`]]
    ));
  }
};

function formatThreeBlock(title, block2Rows, block3Rows) {
  const clean = (value) => String(value).replace(/\u001b\[[0-9;]*m/g, '');
  const width = [...block2Rows, ...block3Rows].reduce((max, [label]) => Math.max(max, clean(label).length), 0);
  const renderRows = (rows) => rows.map(([label, value]) => {
    const left = clean(label).padEnd(width, ' ');
    return style(left, THEME.LABEL_COLOR) + style(' | ', THEME.DIVIDER_COLOR) + style(clean(value), THEME.ACCENT_COLOR);
  });
  return formatAnsiBlocks([
    [formatHeaderTitle(title)],
    renderRows(block2Rows),
    renderRows(block3Rows)
  ]);
}
