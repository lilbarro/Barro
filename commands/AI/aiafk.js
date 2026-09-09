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

<<<<<<< HEAD
    const settings = loadSettings();
    const isEnabled = settings[accountId] || false;

=======
>>>>>>> origin/main
    if (!sub) {
      return message.channel.send(formatThreeBlock(
        'Barro AI AFK',
        [
<<<<<<< HEAD
          ['Enable', `\`${prefix}aiafk enable\``],
          ['Reason', `\`${prefix}aiafk enable [reason]\``],
          ['Disable', `\`${prefix}aiafk disable\``],
          ['Status', `\`${prefix}aiafk status\``]
        ],
        [['Info', 'AI AFK commands and controls.']]
=======
          [style('Enable', '0;30'), style('`,aiafk enable`', '0;97')],
          [style('Reason', '0;30'), style('`,aiafk enable [reason]`', '0;97')],
          [style('Disable', '0;30'), style('`,aiafk disable`', '0;97')],
          [style('Status', '0;30'), style('`,aiafk status`', '0;97')]
        ],
        [[style('Info', '0;30'), style('AI AFK commands and controls.', '0;97')]]
>>>>>>> origin/main
      ));
    }

    if (sub === 'enable' || sub === 'on') {
      if (!cfg || !cfg.enabled) {
        return message.channel.send(formatThreeBlock('Barro AI AFK',
<<<<<<< HEAD
          [['Status', 'OFF']],
          [['Result', 'AI AFK is disabled in config.yaml!']]
        ));
      }

      settings[accountId] = true;
      saveSettings(settings);

=======
          [[style('Status', '0;30'), style('OFF', '0;97')]],
          [[style('Result', '0;30'), style('AI AFK is disabled in config.yaml!', '0;97')]]
        ));
      }
>>>>>>> origin/main
      if (afkSessions.has(userId)) {
        const session = afkSessions.get(userId);
        const duration = formatDuration(Date.now() - session.startedAt);
        return message.channel.send(formatThreeBlock('Barro AI AFK',
<<<<<<< HEAD
          [['Status', 'ON']],
          [['Result', 'Already active.'], ['Duration', duration]]
=======
          [[style('Status', '0;30'), style('ON', '0;97')]],
          [[style('Result', '0;30'), style('Already active.', '0;97')], [style('Duration', '0;30'), style(duration, '0;97')]]
>>>>>>> origin/main
        ));
      }

      const reason = args.slice(1).join(' ').trim() || null;
      afkSessions.set(userId, { reason, startedAt: Date.now(), userName: message.member?.displayName || message.author.username });
      log('AI AFK enabled by ' + message.author.username + ' reason: ' + (reason || 'none'), 'debug');
      return message.channel.send(formatThreeBlock(
        'Barro AI AFK',
<<<<<<< HEAD
        [['Status', 'ON'], ['Reason', reason || 'none']],
        [['Result', 'AI AFK enabled.'], ['Info', 'Mentions and DMs will get an AI response.']]
=======
        [[style('Status', '0;30'), style('ON', '0;97')], [style('Reason', '0;30'), style(reason || 'none', '0;97')]],
        [[style('Result', '0;30'), style('AI AFK enabled.', '0;97')], [style('Info', '0;30'), style('Mentions and DMs will get an AI response.', '0;97')]]
>>>>>>> origin/main
      ));
    }

    if (sub === 'disable' || sub === 'off') {
      settings[accountId] = false;
      saveSettings(settings);

      if (!afkSessions.has(userId)) {
        return message.channel.send(formatThreeBlock('Barro AI AFK',
<<<<<<< HEAD
          [['Status', 'OFF']],
          [['Result', 'AI AFK is not active!']]
=======
          [[style('Status', '0;30'), style('OFF', '0;97')]],
          [[style('Result', '0;30'), style('AI AFK is not active!', '0;97')]]
>>>>>>> origin/main
        ));
      }

      const session = afkSessions.get(userId);
      const duration = formatDuration(Date.now() - session.startedAt);
      const mentions = getMentionLog(userId);
      clearSession(userId);

      const detailRows = [
<<<<<<< HEAD
        ['Duration', duration],
        ['Messages', String(mentions.length)]
      ];
      if (mentions.length > 0) {
        const uniqueSenders = [...new Set(mentions.map(m => m.senderName))];
        detailRows.push(['Senders', String(uniqueSenders.length)]);
=======
        [style('Duration', '0;30'), style(duration, '0;97')],
        [style('Messages', '0;30'), style(String(mentions.length), '0;97')]
      ];
      if (mentions.length > 0) {
        const uniqueSenders = [...new Set(mentions.map(m => m.senderName))];
        detailRows.push([style('Senders', '0;30'), style(String(uniqueSenders.length), '0;97')]);
>>>>>>> origin/main
      }

      log('AI AFK disabled by ' + message.author.username, 'debug');
      return message.channel.send(formatThreeBlock(
        'Barro AI AFK',
<<<<<<< HEAD
        [['Status', 'OFF']],
=======
        [[style('Status', '0;30'), style('OFF', '0;97')]],
>>>>>>> origin/main
        detailRows
      ));
    }

    if (sub === 'status') {
      if (!afkSessions.has(userId)) {
        return message.channel.send(formatThreeBlock(
          'Barro AI AFK',
<<<<<<< HEAD
          [['Status', isEnabled ? 'ON' : 'OFF']],
          [['Result', isEnabled ? 'AI AFK is enabled for this account but you are not currently away.' : 'AI AFK is currently OFF.']]
=======
          [[style('Status', '0;30'), style('OFF', '0;97')]],
          [[style('Result', '0;30'), style('AI AFK is currently OFF.', '0;97')]]
>>>>>>> origin/main
        ));
      }
      const session = afkSessions.get(userId);
      const duration = formatDuration(Date.now() - session.startedAt);
      const mentions = getMentionLog(userId);
      return message.channel.send(formatThreeBlock(
        'Barro AI AFK',
<<<<<<< HEAD
        [['Status', 'ON'], ['Reason', session.reason || 'none']],
        [['Duration', duration], ['Messages', String(mentions.length)]]
=======
        [[style('Status', '0;30'), style('ON', '0;97')], [style('Reason', '0;30'), style(session.reason || 'none', '0;97')]],
        [[style('Duration', '0;30'), style(duration, '0;97')], [style('Messages', '0;30'), style(String(mentions.length), '0;97')]]
>>>>>>> origin/main
      ));
    }

    return message.channel.send(formatThreeBlock(
      'Barro AI AFK',
<<<<<<< HEAD
      [['Status', 'Unknown']],
      [['Result', `Unknown subcommand. Use ${prefix}aiafk enable or ${prefix}aiafk disable.`]]
=======
      [[style('Status', '0;30'), style('Unknown', '0;97')]],
      [[style('Result', '0;30'), style('Unknown subcommand. Use ,aiafk enable or ,aiafk disable.', '0;97')]]
>>>>>>> origin/main
    ));
  }
};

<<<<<<< HEAD
=======
function style(text, colorCode) {
  return `\u001b[${colorCode}m${text}\u001b[0m`;
}

function formatAnsiBlock(lines) {
  return ['> ```ansi', ...lines.map(line => `> ${line}`), '> ```'].join('\n');
}

>>>>>>> origin/main
function formatThreeBlock(title, block2Rows, block3Rows) {
  const clean = (value) => String(value).replace(/\u001b\[[0-9;]*m/g, '');
  const width = [...block2Rows, ...block3Rows].reduce((max, [label]) => Math.max(max, clean(label).length), 0);
  const renderRows = (rows) => rows.map(([label, value]) => {
    const left = clean(label).padEnd(width, ' ');
<<<<<<< HEAD
    return style(left, THEME.LABEL_COLOR) + style(' | ', THEME.DIVIDER_COLOR) + style(clean(value), THEME.ACCENT_COLOR);
  });
  return formatAnsiBlocks([
    [formatHeaderTitle(title)],
    renderRows(block2Rows),
    renderRows(block3Rows)
  ]);
=======
    return style(left, '0;97') + style(' | ', '0;30') + style(clean(value), '0;34');
  });
  return [
    formatAnsiBlock([style(title, '0;30')]),
    formatAnsiBlock(renderRows(block2Rows)),
    formatAnsiBlock(renderRows(block3Rows))
  ].join('\n');
>>>>>>> origin/main
}
