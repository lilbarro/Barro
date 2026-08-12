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
        return message.channel.send(formatAnsiBlock([
          style('[ PURGE ]', '1;30'),
          '',
          style('ERROR:', '1;31') + ' ' + style('Please provide a number between 1 and 100.', '0;97')
        ]));
    }

    // Delete the command message first
    await message.delete().catch(() => {});

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    const collectOwnMessages = async (channel, target) => {
      const collected = [];
      let before;

      while (collected.length < target) {
        const fetched = await channel.messages.fetch({
          limit: 100,
          ...(before ? { before } : {})
        });

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
        return message.channel.send(formatAnsiBlock([
          style('[ PURGE ]', '1;30'),
          '',
          style('ERROR:', '1;31') + ' ' + style('No messages from you found to delete!', '0;97')
        ]));
      }

      let deleted = 0;

      // ---- SERVER ----
      if (message.guild && typeof message.channel.bulkDelete === 'function') {
        const fourteenDays = 14 * 24 * 60 * 60 * 1000;
        const recent = ownMessages.filter(m => Date.now() - m.createdTimestamp < fourteenDays);
        const old = ownMessages.filter(m => Date.now() - m.createdTimestamp >= fourteenDays);

        // Bulk delete recent ones instantly (no delay needed, its one API call)
        if (recent.length) {
          await message.channel.bulkDelete(recent, true).catch(() => {});
          deleted += recent.length;
        }

        // Old messages must be deleted one by one with 100ms delay
        for (const msg of old) {
          try {
            await msg.delete();
            deleted++;
            await sleep(100);
          } catch {
            continue;
          }
        }

      // ---- DM / GC ----
      } else {
        for (const msg of ownMessages) {
          try {
            await msg.delete();
            deleted++;
            await sleep(50);
          } catch {
            continue;
          }
        }
      }

      const confirm = await message.channel.send(formatAnsiBlock([
        style('[ PURGE ]', '1;30'),
        '',
        style('RESULT:', '1;31') + ' ' + style(`Deleted **${deleted}** of your messages.`, '0;97')
      ]));
      setTimeout(() => confirm.delete().catch(() => {}), 3000);

    } catch (err) {
      return message.channel.send(formatAnsiBlock([
        style('[ PURGE ]', '1;30'),
        '',
        style('ERROR:', '1;31') + ' ' + style(`Error: ${err.message}`, '0;97')
      ]));
    }
  }
};

function style(text, colorCode) {
  return `\u001b[${colorCode}m${text}\u001b[0m`;
}

function formatAnsiBlock(lines) {
  return ['> ```ansi', ...lines.map(line => `> ${line}`), '> ```'].join('\n');
}