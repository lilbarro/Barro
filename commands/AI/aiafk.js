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

    // ---- NO ARGS ----
    if (!sub) {
      const confirm = await message.channel.send(
        '> ℹ️ **AI AFK Commands:**\n' +
        '> `,aiafk enable` - Enable AI AFK\n' +
        '> `,aiafk enable [reason]` - Enable with reason\n' +
        '> `,aiafk disable` - Disable AI AFK\n' +
        '> `,aiafk status` - Check current status'
      );
      setTimeout(() => confirm.delete().catch(() => {}), 3000);
      return;
    }

    // ---- ENABLE ----
    if (sub === 'enable' || sub === 'on') {
      if (!cfg || !cfg.enabled) {
        const confirm = await message.channel.send('> ❌ AI AFK is disabled in config.yaml!');
        setTimeout(() => confirm.delete().catch(() => {}), 2000);
        return;
      }

      if (afkSessions.has(userId)) {
        const session = afkSessions.get(userId);
        const duration = formatDuration(Date.now() - session.startedAt);
        const confirm = await message.channel.send(
          '> ⚠️ AI AFK is already active for **' + duration + '**!\n' +
          '> Use `,aiafk disable` to turn it off first.'
        );
        setTimeout(() => confirm.delete().catch(() => {}), 3000);
        return;
      }

      const reason = args.slice(1).join(' ').trim() || null;

      afkSessions.set(userId, {
        reason,
        startedAt: Date.now(),
        userName: message.member?.displayName || message.author.username
      });

      const confirm = await message.channel.send(
        '> 🤖 **AI AFK enabled!**' + (reason ? ' Reason: **' + reason + '**' : '') + '\n' +
        '> Anyone who mentions or DMs you will get an AI response.\n' +
        '> Use `,aiafk disable` to turn off.'
      );
      setTimeout(() => confirm.delete().catch(() => {}), 3000);
      log('AI AFK enabled by ' + message.author.username + ' reason: ' + (reason || 'none'), 'debug');
      return;
    }

    // ---- DISABLE ----
    if (sub === 'disable' || sub === 'off') {
      if (!afkSessions.has(userId)) {
        const confirm = await message.channel.send('> ❌ AI AFK is not active!');
        setTimeout(() => confirm.delete().catch(() => {}), 2000);
        return;
      }

      const session = afkSessions.get(userId);
      const duration = formatDuration(Date.now() - session.startedAt);

      // Get mention summary
      const mentions = getMentionLog(userId);
      clearSession(userId);

      let summary = '> ✅ **AI AFK disabled** after **' + duration + '**.\n';

      if (mentions.length > 0) {
        const uniqueSenders = [...new Set(mentions.map(m => m.senderName))];
        summary += '> 📬 **' + mentions.length + ' message(s)** from **' + uniqueSenders.length + '** person(s):\n';
        mentions.slice(-10).forEach((m, i) => {
          const time = new Date(m.timestamp).toLocaleTimeString();
          summary += '> **' + (i + 1) + '.** **' + m.senderName + '** at ' + time + ': `' +
            m.content.slice(0, 50) + (m.content.length > 50 ? '...' : '') + '`\n';
        });
        if (mentions.length > 10) {
          summary += '> ...and ' + (mentions.length - 10) + ' more\n';
        }
      } else {
        summary += '> 📬 No messages received while away.';
      }

      await message.channel.send(summary).catch(() => {});
      log('AI AFK disabled by ' + message.author.username, 'debug');
      return;
    }

    // ---- STATUS ----
    if (sub === 'status') {
      if (!afkSessions.has(userId)) {
        const confirm = await message.channel.send('> ℹ️ AI AFK is currently **OFF**.');
        setTimeout(() => confirm.delete().catch(() => {}), 2000);
        return;
      }

      const session = afkSessions.get(userId);
      const duration = formatDuration(Date.now() - session.startedAt);
      const mentions = getMentionLog(userId);

      const confirm = await message.channel.send(
        '> ℹ️ **AI AFK Status: ON**\n' +
        '> Active for: **' + duration + '**\n' +
        '> Reason: **' + (session.reason || 'none') + '**\n' +
        '> Messages received: **' + mentions.length + '**'
      );
      setTimeout(() => confirm.delete().catch(() => {}), 5000);
      return;
    }

    // ---- UNKNOWN ----
    const confirm = await message.channel.send(
      '> ❌ Unknown subcommand!\n' +
      '> Use `,aiafk enable` or `,aiafk disable`'
    );
    setTimeout(() => confirm.delete().catch(() => {}), 2000);
  }
};