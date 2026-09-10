import { log } from "../../utils/functions.js";
import { THEME } from "../../utils/theme.js";
import { formatHeaderTitle } from "../../utils/functions.js";

const activeMirrors = new Map();

export default {
  name: 'ragebait',
  description: 'Mirror messages to users',
  aliases: ['rb'],
  usage: '[user mention/id] | stop [user mention/id] | stopall | list',
  category: 'troll',
  type: 'both',
  permissions: [],
  cooldown: 1,
  async execute(client, message, args) {
    await message.delete().catch(() => {});
    const prefix = client.prefix;
    if (!args[0]) {
      return message.channel.send(formatThreeBlock('Barro Ragebait',
        [[style('Start', '0;30'), style(`${prefix}ragebait @user`, '37')], [style('Stop', '0;30'), style(`${prefix}ragebait stop @user`, '37')], [style('List', '0;30'), style(`${prefix}ragebait list`, '37')]],
        [[style('Info', '0;30'), style('Mirror a user back to themselves.', '37')]]
      ));
    }

    if (args[0].toLowerCase() === 'stopall') {
      const count = activeMirrors.size;
      activeMirrors.forEach((session) => client.removeListener('messageCreate', session.listener));
      activeMirrors.clear();
      return message.channel.send(formatThreeBlock('Barro Ragebait', [[style('Result', '0;30'), style('Stopped all sessions.', '37')]], [[style('Count', '0;30'), style(String(count), '37')]]));
    }

    if (args[0].toLowerCase() === 'list') {
      const rows = [...activeMirrors.entries()].map(([userId, session]) => [style(`<@${userId}>`, '37'), style(`${session.count} msgs mirrored`, '37')]);
      if (!rows.length) return message.channel.send(formatThreeBlock('Barro Ragebait', [[style('Sessions', '0;30'), style('0', '37')]], [[style('Result', '0;30'), style('No active ragebait sessions!', '37')]]));
      return message.channel.send(formatAnsiBlocks([
        [formatHeaderTitle('Barro Ragebait')],
        rows.map(([l, r]) => style(l, '37') + style(' | ', THEME.ACCENT_COLOR) + r),
        [style('Result', '0;30'), style(`${rows.length} active session(s)`, '37')]
      ]));
    }

    if (args[0]?.toLowerCase() === 'stop') {
      let targetUser = null;
      if (message.mentions.users.size > 0) {
        targetUser = message.mentions.users.first();
      } else if (args[1]) {
        try {
          const userId = args[1].replace(/[<@!>]/g, "");
          if (/^\d+$/.test(userId)) targetUser = await client.users.fetch(userId);
        } catch {
          targetUser = null;
        }
      }

      if (!targetUser) {
        return message.channel.send(formatThreeBlock('Barro Ragebait', [[style('Target', '0;30'), style('Unknown', '37')]], [[style('Result', '0;30'), style(`Usage: ${prefix}ragebait stop @user`, '37')]]));
      }

      const session = activeMirrors.get(targetUser.id);
      if (!session) {
        return message.channel.send(formatThreeBlock('Barro Ragebait', [[style('Target', '0;30'), style(targetUser.username, '37')]], [[style('Result', '0;30'), style('No active ragebait session for that user!', '37')]]));
      }

      client.removeListener('messageCreate', session.listener);
      activeMirrors.delete(targetUser.id);
      return message.channel.send(formatThreeBlock('Barro Ragebait', [[style('Target', '0;30'), style(targetUser.username, '37')], [style('Count', '0;30'), style(String(session.count), '37')]], [[style('Result', '0;30'), style('Ragebait session stopped!', '37')]]));
    }

    let targetUser;
    try {
      targetUser = message.mentions.users.first() || await client.users.fetch(args[0]);
    } catch {
      return message.channel.send(formatThreeBlock('Barro Ragebait', [[style('Target', '0;30'), style('Unknown', '37')]], [[style('Result', '0;30'), style('Could not find that user!', '37')]]));
    }

    if (targetUser.id === client.user.id) {
      return message.channel.send(formatThreeBlock('Barro Ragebait', [[style('Target', '0;30'), style(targetUser.username, '37')]], [[style('Result', '0;30'), style('Cannot ragebait yourself!', '37')]]));
    }
    if (activeMirrors.has(targetUser.id)) {
      return message.channel.send(formatThreeBlock('Barro Ragebait', [[style('Target', '0;30'), style(targetUser.username, '37')]], [[style('Result', '0;30'), style('Already active for that user!', '37')]]));
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
      [[style('Target', '0;30'), style(targetUser.username, '37')], [style('Status', '0;30'), style('ACTIVE', '37')]],
      [[style('Result', '0;30'), style('Every message they send will be replied back to them.', '37')]]
    ));
  }
};

function style(text, colorCode) { return `[${colorCode}m${text}[0m`; }
function formatAnsiBlock(lines) { return ['> ```ansi', ...lines.map(line => `> ${line}`), '> ```'].join('\n'); }
function formatAnsiBlocks(blocks) {
  const [firstBlock, ...remainingBlocks] = blocks;
  const output = ['> ```ansi', ...firstBlock.map(line => `> ${line}`)];
  remainingBlocks.forEach(block => output.push('> ``````ansi', ...block.map(line => `> ${line}`)));
  output.push('> ```');
  return output.join('\n');
}
function formatThreeBlock(title, block2Rows, block3Rows) {
  const clean = (value) => String(value).replace(/\[[0-9;]*m/g, '');
  const width = [...block2Rows, ...block3Rows].reduce((max, [label]) => Math.max(max, clean(label).length), 0);
  const renderRows = (rows) => rows.map(([label, value]) => style(clean(label).padEnd(width, ' '), THEME.LABEL_COLOR) + style(' | ', THEME.DIVIDER_COLOR) + style(clean(value), THEME.ACCENT_COLOR));
  return formatAnsiBlocks([[formatHeaderTitle(title)], renderRows(block2Rows), renderRows(block3Rows)]);
}
