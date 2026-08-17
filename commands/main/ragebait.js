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
    await message.delete().catch(() => {});
    if (!args[0]) {
      return message.channel.send(formatThreeBlock('Barro Ragebait',
        [[style('Start', '0;30'), style(',ragebait @user', '0;97')], [style('Stop', '0;30'), style(',ragebait stop @user', '0;97')], [style('List', '0;30'), style(',ragebait list', '0;97')]],
        [[style('Info', '0;30'), style('Mirror a user back to themselves.', '0;97')]]
      ));
    }

    if (args[0].toLowerCase() === 'stopall') {
      const count = activeMirrors.size;
      activeMirrors.forEach((session) => client.removeListener('messageCreate', session.listener));
      activeMirrors.clear();
      return message.channel.send(formatThreeBlock('Barro Ragebait', [[style('Result', '0;30'), style('Stopped all sessions.', '0;97')]], [[style('Count', '0;30'), style(String(count), '0;97')]]));
    }

    if (args[0].toLowerCase() === 'list') {
      const rows = [...activeMirrors.entries()].map(([userId, session]) => [style(`<@${userId}>`, '0;97'), style(`${session.count} msgs mirrored`, '0;97')]);
      if (!rows.length) return message.channel.send(formatThreeBlock('Barro Ragebait', [[style('Sessions', '0;30'), style('0', '0;97')]], [[style('Result', '0;30'), style('No active ragebait sessions!', '0;97')]]));
      return message.channel.send([formatAnsiBlock([style('Barro Ragebait', '0;30')]), formatAnsiBlock(rows.map(([l, r]) => style(l, '0;97') + style(' | ', '0;34') + r)), formatAnsiBlock([style('Result', '0;30'), style(`${rows.length} active session(s)`, '0;97')])].join('\n'));
    }

    if (args[0].toLowerCase() === 'stop') {
      const target = message.mentions.users.first() || (args[1] ? await client.users.fetch(args[1]).catch(() => null) : null);
      if (!target) return message.channel.send(formatThreeBlock('Barro Ragebait', [[style('Target', '0;30'), style('Unknown', '0;97')]], [[style('Result', '0;30'), style('Usage: ,ragebait stop @user', '0;97')]]));
      const session = activeMirrors.get(target.id);
      if (!session) return message.channel.send(formatThreeBlock('Barro Ragebait', [[style('Target', '0;30'), style(target.username, '0;97')]], [[style('Result', '0;30'), style('No active ragebait session for that user!', '0;97')]]));
      client.removeListener('messageCreate', session.listener);
      activeMirrors.delete(target.id);
      return message.channel.send(formatThreeBlock('Barro Ragebait', [[style('Target', '0;30'), style(target.username, '0;97')], [style('Count', '0;30'), style(String(session.count), '0;97')]], [[style('Result', '0;30'), style('Ragebait session stopped!', '0;97')]]));
    }

    let targetUser;
    try {
      targetUser = message.mentions.users.first() || await client.users.fetch(args[0]);
    } catch {
      return message.channel.send(formatThreeBlock('Barro Ragebait', [[style('Target', '0;30'), style('Unknown', '0;97')]], [[style('Result', '0;30'), style('Could not find that user!', '0;97')]]));
    }

    if (targetUser.id === client.user.id) {
      return message.channel.send(formatThreeBlock('Barro Ragebait', [[style('Target', '0;30'), style(targetUser.username, '0;97')]], [[style('Result', '0;30'), style('Cannot ragebait yourself!', '0;97')]]));
    }
    if (activeMirrors.has(targetUser.id)) {
      return message.channel.send(formatThreeBlock('Barro Ragebait', [[style('Target', '0;30'), style(targetUser.username, '0;97')]], [[style('Result', '0;30'), style('Already active for that user!', '0;97')]]));
    }

    const session = { count: 0, listener: null, lastReplyAt: 0, replyCooldownMs: 1000 };
    const listener = async (msg) => {
      try {
        if (msg.author.id !== targetUser.id || msg.author.bot || msg.content.startsWith(client.prefix)) return;
        if (Date.now() - session.lastReplyAt < session.replyCooldownMs) return;
        session.lastReplyAt = Date.now();
        const content = msg.content || '';
        const files = msg.attachments.size > 0 ? [...msg.attachments.values()].map(a => a.url) : [];
        if (!content && files.length === 0) return;
        let mirrorContent = content;
        if (files.length) mirrorContent += (mirrorContent ? '\n' : '') + files.join('\n');
        await msg.reply({ content: mirrorContent, allowedMentions: { repliedUser: true } });
        session.count++;
      } catch {}
    };
    session.listener = listener;
    activeMirrors.set(targetUser.id, session);
    client.on('messageCreate', listener);

    return message.channel.send(formatThreeBlock('Barro Ragebait',
      [[style('Target', '0;30'), style(targetUser.username, '0;97')], [style('Status', '0;30'), style('ACTIVE', '0;97')]],
      [[style('Result', '0;30'), style('Every message they send will be replied back to them.', '0;97')]]
    ));
  }
};

function style(text, colorCode) { return `\u001b[${colorCode}m${text}\u001b[0m`; }
function formatAnsiBlock(lines) { return ['> ```ansi', ...lines.map(line => `> ${line}`), '> ```'].join('\n'); }
function formatThreeBlock(title, block2Rows, block3Rows) {
  const clean = (value) => String(value).replace(/\u001b\[[0-9;]*m/g, '');
  const width = [...block2Rows, ...block3Rows].reduce((max, [label]) => Math.max(max, clean(label).length), 0);
  const renderRows = (rows) => rows.map(([label, value]) => {
    const left = clean(label).padEnd(width, ' ');
    return style(left, '0;97') + style(' | ', '0;30') + style(clean(value), '0;34');
  });
  return [formatAnsiBlock([style(title, '0;30')]), formatAnsiBlock(renderRows(block2Rows)), formatAnsiBlock(renderRows(block3Rows))].join('\n');
}
