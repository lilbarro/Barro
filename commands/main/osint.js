import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const PFP_PATH = resolve('./data/pfphistory.json');
const NAME_PATH = resolve('./data/namehistory.json');
const BANNER_PATH = resolve('./data/bannerhistory.json');

function loadJSON(path) {
  try {
    if (!existsSync(path)) return {};
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return {};
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function formatDate(isoString) {
  try {
    return new Date(isoString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } catch {
    return 'Unknown date';
  }
}

function getAccountAge(timestamp) {
  try {
    const days = Math.floor((Date.now() - timestamp) / 86400000);
    const y = Math.floor(days / 365);
    const m = Math.floor((days % 365) / 30);
    const d = days % 30;
    return y + 'y ' + m + 'm ' + d + 'd';
  } catch {
    return 'Unknown';
  }
}

export default {
  name: 'osint',
  description: 'Runs a full OSINT scan on a Discord user.',
  aliases: ['scan', 'investigate'],
  usage: '[user id]',
  category: 'main',
  type: 'both',
  permissions: [],
  cooldown: 10,
  async execute(client, message, args) {
    let target;
    try {
      const mentioned = message.mentions.users.first();
      if (mentioned) {
        target = mentioned;
      } else if (args[0]) {
        target = await client.users.fetch(args[0]);
      } else {
        target = message.author;
      }
    } catch {
      return message.channel.send('> ❌ Could not find that user!');
    }

    let scanMsg;
    try {
      scanMsg = await message.channel.send(renderOsintView({
        title: 'Barro v1.5 Osint Scanner',
        target: target.username,
        id: target.id,
        phase: 'Initializing',
        progress: '0%',
        stageLines: [stageLine('1. Establishing secure connection', 'Active')],
        stageDescription: 'Establishes a secured connection between Barro and the user.'
      }));
    } catch (err) {
      return message.channel.send(formatAnsiBlock([style('> ❌ Error starting scan: ' + err.message, '1;91')]));
    }

    await sleep(2000);

    await scanMsg.edit(renderOsintView({
      title: 'Barro v1.5 Osint Scanner',
      target: target.username,
      id: target.id,
      phase: 'Scanning',
      progress: '20%',
      stageLines: [
        stageLine('1. Establishing secure connection', 'Done'),
        stageLine('2. Fetching account information', 'Active')
      ],
      stageDescription: 'Fetches the details of the user.'
    })).catch(() => {});

    await sleep(2500);

    await scanMsg.edit(renderOsintView({
      title: 'Barro v1.5 Osint Scanner',
      target: target.username,
      id: target.id,
      phase: 'Extracting',
      progress: '40%',
      stageLines: [
        stageLine('1. Establishing secure connection', 'Done'),
        stageLine('2. Fetching account information', 'Done'),
        stageLine('3. Extracting avatar history', 'Active')
      ],
      stageDescription: 'Extracting the avatar and banner history of the user.'
    })).catch(() => {});

    await sleep(2500);

    await scanMsg.edit(renderOsintView({
      title: 'Barro v1.5 Osint Scanner',
      target: target.username,
      id: target.id,
      phase: 'Decrypting',
      progress: '60%',
      stageLines: [
        stageLine('1. Establishing secure connection', 'Done'),
        stageLine('2. Fetching account information', 'Done'),
        stageLine('3. Extracting avatar history', 'Done'),
        stageLine('4. Decrypting username logs', 'Active')
      ],
      stageDescription: 'Decrypting the username history of the user.'
    })).catch(() => {});

    await sleep(2500);

    await scanMsg.edit(renderOsintView({
      title: 'Barro v1.5 Osint Scanner',
      target: target.username,
      id: target.id,
      phase: 'Compiling',
      progress: '80%',
      stageLines: [
        stageLine('1. Establishing secure connection', 'Done'),
        stageLine('2. Fetching account information', 'Done'),
        stageLine('3. Extracting avatar history', 'Done'),
        stageLine('4. Decrypting username logs', 'Done'),
        stageLine('5. Compiling final report', 'Active')
      ],
      stageDescription: 'Compiling final report...'
    })).catch(() => {});

    await sleep(2000);

    let fullUser = target;
    let currentPFP = 'UNAVAILABLE';
    let currentBanner = 'NONE';

    try {
      fullUser = await client.users.fetch(target.id, { force: true });
    } catch {
      fullUser = target;
    }

    try {
      currentPFP = fullUser.displayAvatarURL({ dynamic: true, size: 1024 });
    } catch {
      currentPFP = 'UNAVAILABLE';
    }

    try {
      const b = fullUser.bannerURL({ dynamic: true, size: 1024 });
      currentBanner = b || 'NONE';
    } catch {
      currentBanner = 'NONE';
    }

    let pfpHistory = [];
    let nameHistory = [];
    let bannerHistory = [];

    try { pfpHistory = loadJSON(PFP_PATH)[target.id] || []; } catch {}
    try { nameHistory = loadJSON(NAME_PATH)[target.id] || []; } catch {}
    try { bannerHistory = loadJSON(BANNER_PATH)[target.id] || []; } catch {}

    const createdAt = formatDate(target.createdTimestamp);
    const accountAge = getAccountAge(target.createdTimestamp);

    await scanMsg.edit(renderFinalView({
      target: target.username,
      id: target.id,
      phase: 'Complete',
      progress: '100%',
      createdAt,
      accountAge,
      currentPFP,
      currentBanner,
      pfpHistory,
      nameHistory,
      bannerHistory
    })).catch(async (err) => {
      await message.channel.send(formatAnsiBlock([style('> ❌ Error showing results: ' + err.message, '1;91')]));
    });

    if (pfpHistory.length > 0) {
      let pfpMsg = '**[ PFP HISTORY - ' + target.username + ' ]**\n';
      [...pfpHistory].reverse().forEach((entry, i) => {
        pfpMsg += '> **' + (i + 1) + '.** Changed on `' + formatDate(entry.changedAt) + '`\n';
        pfpMsg += '> ' + entry.url + '\n';
      });
      await message.channel.send(pfpMsg).catch(() => {});
    }

    if (nameHistory.length > 0) {
      let nameMsg = '**[ USERNAME HISTORY - ' + target.username + ' ]**\n';
      [...nameHistory].reverse().forEach((entry, i) => {
        nameMsg += '> **' + (i + 1) + '.** Was `' + entry.name + '` - Changed on `' + formatDate(entry.changedAt) + '`\n';
      });
      await message.channel.send(nameMsg).catch(() => {});
    }

    if (bannerHistory.length > 0) {
      let bannerMsg = '**[ BANNER HISTORY - ' + target.username + ' ]**\n';
      [...bannerHistory].reverse().forEach((entry, i) => {
        bannerMsg += '> **' + (i + 1) + '.** Changed on `' + formatDate(entry.changedAt) + '`\n';
        bannerMsg += '> ' + entry.url + '\n';
      });
      await message.channel.send(bannerMsg).catch(() => {});
    }
  }
};

function style(text, colorCode) {
  return `\u001b[${colorCode}m${text}\u001b[0m`;
}

function formatAnsiBlock(lines) {
  return ['> ```ansi', ...lines.map(line => `> ${line}`), '> ```'].join('\n');
}

function renderOsintView({ title, target, id, phase, progress, stageLines, stageDescription }) {
  return [
    formatAnsiBlock([
      style('Barro v1.5', '4;30') + style(' Osint Scanner', '0;34')
    ]),
    formatAnsiBlock([
      style('Target', '0;30'),
      kvBlue('Name', target, 10),
      kvBlue('Id', id, 10),
      '',
      style('Status', '0;30'),
      kvBlue('Phase', phase, 10),
      kvBlue('Progress', progress, 10)
    ]),
    formatAnsiBlock([
      style('Stages', '0;34'),
      ...stageLines,
      style('>> ' + stageDescription, '0;97')
    ])
  ].join('\n');
}

function renderFinalView({ target, id, phase, progress, createdAt, accountAge, currentPFP, currentBanner, pfpHistory, nameHistory, bannerHistory }) {
  return [
    formatAnsiBlock([
      style('Barro v1.5', '4;30') + style(' Osint Scanner', '0;34')
    ]),
    formatAnsiBlock([
      style('Target', '0;30'),
      kvBlue('Name', target, 10),
      kvBlue('Id', id, 10),
      '',
      style('Status', '0;30'),
      kvBlue('Phase', phase, 10),
      kvBlue('Progress', progress, 10)
    ]),
    formatAnsiBlock([
      style('Account information', '0;34'),
      kvBlue('User id', id, 10),
      kvBlue('Bot', 'Unknown', 10),
      kvBlue('Created', createdAt, 10),
      kvBlue('Acc age', accountAge, 10),
      '',
      style('Current assets', '0;30'),
      kv('Avatar', currentPFP, 10),
      kvBlue('Banner', currentBanner, 10),
      '',
      style('History summary', '0;30'),
      kvBlue('Pfp logs', pfpHistory.length + ' tracked', 10),
      kvBlue('Name logs', nameHistory.length + ' tracked', 10),
      kvBlue('Banner log', bannerHistory.length + ' tracked', 10)
    ])
  ].join('\n');
}

function kv(label, value, padTo) {
  const padded = String(label).padEnd(padTo, ' ');
  return style(padded, '0;30') + style(' | ', '0;34') + style(String(value), '0;97');
}

function kvBlue(label, value, padTo) {
  const padded = String(label).padEnd(padTo, ' ');
  return style(padded, '0;34') + style(' | ', '0;34') + style(String(value), '0;97');
}

function stageLine(label, tag) {
  return style(label, '0;30') + style(' | ', '0;34') + style(tag, tag === 'Done' ? '0;32' : '0;34');
}
