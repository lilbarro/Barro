import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const DATA_PATH = resolve('./data/aireply.json');

function loadData() {
  try {
    if (!existsSync(DATA_PATH)) return { enabled: false, conversations: {} };
    return JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
  } catch {
    return { enabled: false, conversations: {} };
  }
}

function saveData(data) {
  try {
    writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
  } catch {}
}

export default {
  name: 'aireply',
  description: 'Toggle AI auto reply for DMs, GCs and server mentions.',
  aliases: ['aimode', 'autoreply'],
  usage: '[on | off | clear]',
  category: 'main',
  type: 'both',
  permissions: [],
  cooldown: 5,
  async execute(client, message, args) {

    // Delete the command message itself
    await message.delete().catch(() => {});

    const sub = args[0]?.toLowerCase();
    const data = loadData();

    if (sub === 'on') {
      data.enabled = true;
      saveData(data);
      const confirm = await message.channel.send(
  '> ✅ **AI Reply enabled!**\n' +
  '> Anyone who DMs, mentions or replies to me will get an AI response.\n' +
  '> Use `,aireply off` to disable.'
);
setTimeout(() => confirm.delete().catch(() => {}), 1000);
return;

    } else if (sub === 'off') {
      data.enabled = false;
      saveData(data);
     const confirm = await message.channel.send('> ✅ **AI Reply disabled!**');
setTimeout(() => confirm.delete().catch(() => {}), 1000);
return;

    } else if (sub === 'clear') {
      data.conversations = {};
      saveData(data);
      return message.channel.send('> ✅ **All conversation history cleared!**');

    } else {
      const convCount = Object.keys(data.conversations || {}).length;
      return message.channel.send(
        '> ℹ️ **AI Reply Status:** ' + (data.enabled ? '✅ ON' : '❌ OFF') + '\n' +
        '> **People tracked:** ' + convCount + '\n' +
        '> \n' +
        '> `,aireply on` - Enable\n' +
        '> `,aireply off` - Disable\n' +
        '> `,aireply clear` - Clear all conversation history'
      );
    }
  }
};