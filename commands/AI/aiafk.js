import { loadConfig, log } from "../../utils/functions.js";
import { afkSessions, formatDuration, getMentionLog, clearSession } from "../../utils/aiAfkHandler.js";

export default {
  name: 'aiafk',
  description: 'Set an AI powered AFK that responds to mentions on your behalf.',
  aliases: ['aiaway'],
  usage: '[enable | disable] [reason]',
  category: 'ai',
  type: 'both',
  permissions: [],
  cooldown: 15,
  async execute(client, message, args) {
    const cfg = loadConfig()?.ai_afk;
    const userId = message.author.id;
    const sub = args[0]?.toLowerCase();
    await message.delete().catch(() => {});

    if (!sub) {
      return message.channel.send(formatThreeBlock(
        'Barro AI AFK',
        [
          [style('Enable', '0;30'), style('`,aiafk enable`', '0;97')],
          [style('Reason', '0;30'), style('`,aiafk enable [reason]`', '0;97')],
          [style('Disable', '0;30'), style('`,aiafk disable`', '0;97')],
          [style('Status', '0;30'), style('`,aiafk status`', '0;97')]
        ],
        [[style('Info', '0;30'), style('AI AFK commands and controls.', '0;97')]]
      ));
    }

    if (sub === 'enable' || sub === 'on') {
      if (!cfg || !cfg.enabled) {
        return message.channel.send(formatThreeBlock('Barro AI AFK',
          [[style('Status', '0;30'), style('OFF', '0;97')]],
          [[style('Result', '0;30'), style('AI AFK is disabled in config.yaml!', '0;97')]]
        ));
      }
      if (afkSessions.has(userId)) {
        const session = afkSessions.get(userId);
        const duration = formatDuration(Date.now() - session.startedAt);
        return message.channel.send(formatThreeBlock('Barro AI AFK',
          [[style('Status', '0;30'), style('ON', '0;97')]],
          [[style('Result', '0;30'), style('Already active.', '0;97')], [style('Duration', '0;30'), style(duration, '0;97')]]
        ));
      }

      const reason = args.slice(1).join(' ').trim() || null;
      afkSessions.set(userId, { reason, startedAt: Date.now(), userName: message.member?.displayName || message.author.username });
      log('AI AFK enabled by ' + message.author.username + ' reason: ' + (reason || 'none'), 'debug');
      return message.channel.send(formatThreeBlock(
        'Barro AI AFK',
        [[style('Status', '0;30'), style('ON', '0;97')], [style('Reason', '0;30'), style(reason || 'none', '0;97')]],
        [[style('Result', '0;30'), style('AI AFK enabled.', '0;97')], [style('Info', '0;30'), style('Mentions and DMs will get an AI response.', '0;97')]]
      ));
    }

    if (sub === 'disable' || sub === 'off') {
      if (!afkSessions.has(userId)) {
        return message.channel.send(formatThreeBlock('Barro AI AFK',
          [[style('Status', '0;30'), style('OFF', '0;97')]],
          [[style('Result', '0;30'), style('AI AFK is not active!', '0;97')]]
        ));
      }

      const session = afkSessions.get(userId);
      const duration = formatDuration(Date.now() - session.startedAt);
      const mentions = getMentionLog(userId);
      clearSession(userId);

      const detailRows = [
        [style('Duration', '0;30'), style(duration, '0;97')],
        [style('Messages', '0;30'), style(String(mentions.length), '0;97')]
      ];
      if (mentions.length > 0) {
        const uniqueSenders = [...new Set(mentions.map(m => m.senderName))];
        detailRows.push([style('Senders', '0;30'), style(String(uniqueSenders.length), '0;97')]);
      }

      log('AI AFK disabled by ' + message.author.username, 'debug');
      return message.channel.send(formatThreeBlock(
        'Barro AI AFK',
        [[style('Status', '0;30'), style('OFF', '0;97')]],
        detailRows
      ));
    }

    if (sub === 'status') {
      if (!afkSessions.has(userId)) {
        return message.channel.send(formatThreeBlock(
          'Barro AI AFK',
          [[style('Status', '0;30'), style('OFF', '0;97')]],
          [[style('Result', '0;30'), style('AI AFK is currently OFF.', '0;97')]]
        ));
      }
      const session = afkSessions.get(userId);
      const duration = formatDuration(Date.now() - session.startedAt);
      const mentions = getMentionLog(userId);
      return message.channel.send(formatThreeBlock(
        'Barro AI AFK',
        [[style('Status', '0;30'), style('ON', '0;97')], [style('Reason', '0;30'), style(session.reason || 'none', '0;97')]],
        [[style('Duration', '0;30'), style(duration, '0;97')], [style('Messages', '0;30'), style(String(mentions.length), '0;97')]]
      ));
    }

    return message.channel.send(formatThreeBlock(
      'Barro AI AFK',
      [[style('Status', '0;30'), style('Unknown', '0;97')]],
      [[style('Result', '0;30'), style('Unknown subcommand. Use ,aiafk enable or ,aiafk disable.', '0;97')]]
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
