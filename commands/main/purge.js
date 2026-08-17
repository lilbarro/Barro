export default {
  name: 'purge',
  description: 'Deletes your messages in DMs, GCs or servers.',
  aliases: ['clear', 'delete'],
  usage: '[amount]',
  category: 'general',
  type: 'both',
  permissions: [],
  cooldown: 30,

  async execute(client, message, args) {
    const amount = Number.parseInt(args[0], 10);

    if (!Number.isInteger(amount) || amount < 1 || amount > 100) {
      return message.channel.send(formatThreeBlock('Barro Purge', [['Amount', 'Invalid']], [['Result', 'Please provide a number between 1 and 100.']]));
    }

    await message.delete().catch(() => {});

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    const collectOwnMessages = async (channel, target) => {
      const collected = [];
      let before;
      while (collected.length < target) {
        const fetched = await channel.messages.fetch({ limit: 100, ...(before ? { before } : {}) });
        if (!fetched.size) break;
        for (const m of fetched.values()) {
          if (m.author.id === client.user.id) {
            collected.push(m);
            if (collected.length === target) break;
          }
        }
        before = fetched.last()?.id;
        if (fetched.size < 100) break;
      }
      return collected.slice(0, target);
    };

    try {
      const ownMessages = await collectOwnMessages(message.channel, amount);
      if (ownMessages.length === 0) {
        return message.channel.send(formatThreeBlock('Barro Purge', [['Amount', String(amount)]], [['Result', 'No messages from you found to delete!']]));
      }

      let deleted = 0;
      if (message.guild && typeof message.channel.bulkDelete === 'function') {
        const fourteenDays = 14 * 24 * 60 * 60 * 1000;
        const recent = ownMessages.filter(m => Date.now() - m.createdTimestamp < fourteenDays);
        const old = ownMessages.filter(m => Date.now() - m.createdTimestamp >= fourteenDays);
        if (recent.length) {
          await message.channel.bulkDelete(recent, true).catch(() => {});
          deleted += recent.length;
        }
        for (const msg of old) {
          try {
            await msg.delete();
            deleted++;
            await sleep(100);
          } catch {}
        }
      } else {
        for (const msg of ownMessages) {
          try {
            await msg.delete();
            deleted++;
            await sleep(50);
          } catch {}
        }
      }

      const confirm = await message.channel.send(formatThreeBlock('Barro Purge', [['Amount', String(amount)]], [['Result', `Deleted ${deleted} of your messages.`]]));
      setTimeout(() => confirm.delete().catch(() => {}), 3000);
    } catch (err) {
      return message.channel.send(formatThreeBlock('Barro Purge', [['Status', 'Error']], [['Result', `Error: ${err.message}`]]));
    }
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
  const renderRows = (rows) => rows.map(([label, value]) => style(clean(label).padEnd(width, ' '), '0;97') + style(' | ', '0;30') + style(clean(value), '0;34'));
  return [formatAnsiBlock([style(title, '0;30')]), formatAnsiBlock(renderRows(block2Rows)), formatAnsiBlock(renderRows(block3Rows))].join('\n');
}
