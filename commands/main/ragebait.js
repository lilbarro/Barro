const activeMirrors = new Map();

export default {
  name: 'ragebait',
  description: 'Mirrors every message a user sends back to them as a reply.',
  aliases: ['rb'],
  usage: '[user mention/id] | stop [user mention/id] | stopall | list',
  category: 'main',
  type: 'both',
  permissions: [],
  cooldown: 30,
  async execute(client, message, args) {

    // Delete the command message itself
    await message.delete().catch(() => {});

    // ---- NO ARGS ----
    if (!args[0]) {
      const confirm = await message.channel.send(formatAnsiBlock([
        style('[ RAGEBAIT ]', '1;30'),
        '',
        style('INFO:', '1;31') + ' ' + style('Ragebait Commands:', '0;97'),
        '  ,ragebait @user - Start mirroring a user',
        '  ,ragebait stop @user - Stop mirroring a user',
        '  ,ragebait stopall - Stop all sessions',
        '  ,ragebait list - Show active sessions'
      ]));
      setTimeout(() => confirm.delete().catch(() => {}), 1000);
      return;
    }

    // ---- STOP ALL ----
    if (args[0].toLowerCase() === 'stopall') {
      if (activeMirrors.size === 0) {
        const confirm = await message.channel.send(formatAnsiBlock([
          style('[ RAGEBAIT ]', '1;30'),
          '',
          style('ERROR:', '1;31') + ' ' + style('No active ragebait sessions!', '0;97')
        ]));
        setTimeout(() => confirm.delete().catch(() => {}), 1000);
        return;
      }

      for (const [userId, session] of activeMirrors) {
        client.removeListener('messageCreate', session.listener);
      }

      const count = activeMirrors.size;
      activeMirrors.clear();

      const confirm = await message.channel.send(formatAnsiBlock([
        style('[ RAGEBAIT ]', '1;30'),
        '',
        style('RESULT:', '1;31') + ' ' + style('Stopped ' + count + ' ragebait session(s)!', '0;97')
      ]));
      setTimeout(() => confirm.delete().catch(() => {}), 1000);
      return;
    }

    // ---- LIST ----
    if (args[0].toLowerCase() === 'list') {
      if (activeMirrors.size === 0) {
        const confirm = await message.channel.send(formatAnsiBlock([
          style('[ RAGEBAIT ]', '1;30'),
          '',
          style('ERROR:', '1;31') + ' ' + style('No active ragebait sessions!', '0;97')
        ]));
        setTimeout(() => confirm.delete().catch(() => {}), 1000);
        return;
      }

      const lines = [
        style('[ RAGEBAIT ]', '1;30'),
        '',
        style('LIST:', '1;31') + ' ' + style('Active Ragebait Sessions:', '0;97')
      ];
      for (const [userId, session] of activeMirrors) {
        lines.push('  • <@' + userId + '> - ' + session.count + ' msgs mirrored');
      }

      const confirm = await message.channel.send(formatAnsiBlock(lines));
      setTimeout(() => confirm.delete().catch(() => {}), 1000);
      return;
    }

    // ---- STOP SPECIFIC USER ----
    if (args[0].toLowerCase() === 'stop') {
      let targetId;
      const mentioned = message.mentions.users.first();
      if (mentioned) {
        targetId = mentioned.id;
      } else if (args[1]) {
        targetId = args[1];
      }

      if (!targetId) {
        const confirm = await message.channel.send(formatAnsiBlock([
          style('[ RAGEBAIT ]', '1;30'),
          '',
          style('ERROR:', '1;31') + ' ' + style('Usage: ,ragebait stop @user', '0;97')
        ]));
        setTimeout(() => confirm.delete().catch(() => {}), 1000);
        return;
      }

      if (!activeMirrors.has(targetId)) {
        const confirm = await message.channel.send(formatAnsiBlock([
          style('[ RAGEBAIT ]', '1;30'),
          '',
          style('ERROR:', '1;31') + ' ' + style('No active ragebait session for that user!', '0;97')
        ]));
        setTimeout(() => confirm.delete().catch(() => {}), 1000);
        return;
      }

      const session = activeMirrors.get(targetId);
      client.removeListener('messageCreate', session.listener);
      activeMirrors.delete(targetId);

      const confirm = await message.channel.send(formatAnsiBlock([
        style('[ RAGEBAIT ]', '1;30'),
        '',
        style('RESULT:', '1;31') + ' ' + style('Ragebait session stopped!', '0;97'),
        style('DETAILS:', '1;31') + ' ' + style('Mirrored ' + session.count + ' messages total.', '0;97')
      ]));
      setTimeout(() => confirm.delete().catch(() => {}), 1000);
      return;
    }

    // ---- START ----
    let targetUser;
    try {
      const mentioned = message.mentions.users.first();
      if (mentioned) {
        targetUser = mentioned;
      } else {
        targetUser = await client.users.fetch(args[0]);
      }
    } catch {
      const confirm = await message.channel.send(formatAnsiBlock([
        style('[ RAGEBAIT ]', '1;30'),
        '',
        style('ERROR:', '1;31') + ' ' + style('Could not find that user!', '0;97')
      ]));
      setTimeout(() => confirm.delete().catch(() => {}), 1000);
      return;
    }

    if (targetUser.id === client.user.id) {
      const confirm = await message.channel.send(formatAnsiBlock([
        style('[ RAGEBAIT ]', '1;30'),
        '',
        style('ERROR:', '1;31') + ' ' + style('Cannot ragebait yourself!', '0;97')
      ]));
      setTimeout(() => confirm.delete().catch(() => {}), 1000);
      return;
    }

    if (activeMirrors.has(targetUser.id)) {
      const confirm = await message.channel.send(formatAnsiBlock([
        style('[ RAGEBAIT ]', '1;30'),
        '',
        style('ERROR:', '1;31') + ' ' + style('Already ragebaiting ' + targetUser.username + '!', '0;97'),
        style('INFO:', '1;31') + ' ' + style('Use ,ragebait stop @' + targetUser.username + ' first.', '0;97')
      ]));
      setTimeout(() => confirm.delete().catch(() => {}), 1000);
      return;
    }

    // Send start confirmation
    const confirm = await message.channel.send(formatAnsiBlock([
      style('[ RAGEBAIT ]', '1;30'),
      '',
      style('RESULT:', '1;31') + ' ' + style('Ragebait started on ' + targetUser.username + '!', '0;97'),
      style('INFO:', '1;31') + ' ' + style('Every message they send will be replied back to them.', '0;97'),
      style('INFO:', '1;31') + ' ' + style('Use ,ragebait stop ' + targetUser.id + ' to stop.', '0;97')
    ]));
    setTimeout(() => confirm.delete().catch(() => {}), 1000);

    // Create session object
    const session = {
      count: 0,
      listener: null,
      // Per-session reply throttle (1000ms = 1 reply/second max).
      lastReplyAt: 0,
      replyCooldownMs: 1000,
    };

    // Message listener
    const messageListener = async (msg) => {
      try {
        if (msg.author.id !== targetUser.id) return;
        if (msg.author.id === client.user.id) return;
        if (msg.author.bot) return;
        if (msg.content.startsWith(client.prefix)) return;

        if (!activeMirrors.has(targetUser.id)) {
          client.removeListener('messageCreate', messageListener);
          return;
        }

        // ---- Per-session throttle: drop mirror replies that arrive before
        // the cooldown elapses. Mirroring at the sender's full send rate is
        // what makes ragebait look like a selfbot.
        const now = Date.now();
        if (now - session.lastReplyAt < session.replyCooldownMs) {
          return;
        }
        session.lastReplyAt = now;

        const content = msg.content || '';
        const files = msg.attachments.size > 0
          ? [...msg.attachments.values()].map(a => a.url)
          : [];

        if (!content && files.length === 0) return;

        let mirrorContent = '';
        if (content) mirrorContent += content;
        if (files.length > 0) {
          mirrorContent += (mirrorContent ? '\n' : '') + files.join('\n');
        }

        await msg.reply({
          content: mirrorContent,
          allowedMentions: { repliedUser: true }
        });

        session.count++;
        activeMirrors.get(targetUser.id).count = session.count;

      } catch (err) {
        // Silently fail
      }
    };

    session.listener = messageListener;
    activeMirrors.set(targetUser.id, session);
    client.on('messageCreate', messageListener);
  }
};

function style(text, colorCode) {
  return `\u001b[${colorCode}m${text}\u001b[0m`;
}

function formatAnsiBlock(lines) {
  return ['> ```ansi', ...lines.map(line => `> ${line}`), '> ```'].join('\n');
}