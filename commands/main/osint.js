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

function progressBar(current, total, size = 10) {
  const filled = Math.round((current / total) * size);
  const empty = size - filled;
  return '■'.repeat(filled) + '□'.repeat(empty);
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

    // ---- GET TARGET ----
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

    // ---- STAGE 1 ----
    let scanMsg;
    try {
      const lines = [
        style('[ YHWACH OSINT SCANNER v1.0 ]', '0;30'),
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        style('> TARGET    :', '1;31') + ' ' + style(target.username, '0;97'),
        style('> TARGET ID :', '1;31') + ' ' + style(target.id, '0;97'),
        style('> STATUS    :', '1;31') + ' ' + style('INITIALIZING', '0;97'),
        style('> PROGRESS  :', '1;31') + ' ' + style('[' + progressBar(0, 5) + '] 0%', '0;97'),
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '>> Establishing secure connection...'
      ];

      scanMsg = await message.channel.send(formatAnsiBlock(lines));
    } catch (err) {
      return message.channel.send(formatAnsiBlock([style('> ❌ Error starting scan: ' + err.message, '1;91')]));
    }

    await sleep(2000);

    // ---- STAGE 2 ----
    await scanMsg.edit(formatAnsiBlock([
      style('[ YHWACH OSINT SCANNER v1.0 ]', '0;30'),
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      style('> TARGET    :', '1;31') + ' ' + style(target.username, '0;97'),
      style('> TARGET ID :', '1;31') + ' ' + style(target.id, '0;97'),
      style('> STATUS    :', '1;31') + ' ' + style('SCANNING', '0;97'),
      style('> PROGRESS  :', '1;31') + ' ' + style('[' + progressBar(1, 5) + '] 20%', '0;97'),
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '>> Establishing secure connection... DONE',
      '>> Fetching account information...'
    ])).catch(() => {});

    await sleep(2500);

    // ---- STAGE 3 ----
    await scanMsg.edit(formatAnsiBlock([
      style('[ YHWACH OSINT SCANNER v1.0 ]', '0;30'),
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      style('> TARGET    :', '1;31') + ' ' + style(target.username, '0;97'),
      style('> TARGET ID :', '1;31') + ' ' + style(target.id, '0;97'),
      style('> STATUS    :', '1;31') + ' ' + style('EXTRACTING', '0;97'),
      style('> PROGRESS  :', '1;31') + ' ' + style('[' + progressBar(2, 5) + '] 40%', '0;97'),
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '>> Establishing secure connection... DONE',
      '>> Fetching account information... DONE',
      '>> Extracting avatar history...'
    ])).catch(() => {});

    await sleep(2500);

    // ---- STAGE 4 ----
    await scanMsg.edit(formatAnsiBlock([
      style('[ YHWACH OSINT SCANNER v1.0 ]', '0;30'),
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      style('> TARGET    :', '1;31') + ' ' + style(target.username, '0;97'),
      style('> TARGET ID :', '1;31') + ' ' + style(target.id, '0;97'),
      style('> STATUS    :', '1;31') + ' ' + style('DECRYPTING', '0;97'),
      style('> PROGRESS  :', '1;31') + ' ' + style('[' + progressBar(3, 5) + '] 60%', '0;97'),
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '>> Establishing secure connection... DONE',
      '>> Fetching account information... DONE',
      '>> Extracting avatar history... DONE',
      '>> Decrypting username logs...'
    ])).catch(() => {});

    await sleep(2500);

    // ---- STAGE 5 ----
    await scanMsg.edit(formatAnsiBlock([
      style('[ YHWACH OSINT SCANNER v1.0 ]', '0;30'),
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      style('> TARGET    :', '1;31') + ' ' + style(target.username, '0;97'),
      style('> TARGET ID :', '1;31') + ' ' + style(target.id, '0;97'),
      style('> STATUS    :', '1;31') + ' ' + style('COMPILING', '0;97'),
      style('> PROGRESS  :', '1;31') + ' ' + style('[' + progressBar(4, 5) + '] 80%', '0;97'),
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '>> Establishing secure connection... DONE',
      '>> Fetching account information... DONE',
      '>> Extracting avatar history... DONE',
      '>> Decrypting username logs... DONE',
      '>> Compiling final report...'
    ])).catch(() => {});

    await sleep(2000);

    // ---- FETCH FULL PROFILE SAFELY ----
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

    // ---- LOAD HISTORY SAFELY ----
    let pfpHistory = [];
    let nameHistory = [];
    let bannerHistory = [];

    try { pfpHistory = loadJSON(PFP_PATH)[target.id] || []; } catch {}
    try { nameHistory = loadJSON(NAME_PATH)[target.id] || []; } catch {}
    try { bannerHistory = loadJSON(BANNER_PATH)[target.id] || []; } catch {}

    // ---- ACCOUNT INFO ----
    const createdAt = formatDate(target.createdTimestamp);
    const accountAge = getAccountAge(target.createdTimestamp);

    // ---- FINAL RESULT ----
    await scanMsg.edit(formatAnsiBlock([
      style('[ YHWACH OSINT SCANNER v1.0 ]', '0;30'),
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      style('> TARGET    :', '1;31') + ' ' + style(target.username, '0;97'),
      style('> TARGET ID :', '1;31') + ' ' + style(target.id, '0;97'),
      style('> STATUS    :', '1;31') + ' ' + style('COMPLETE', '0;97'),
      style('> PROGRESS  :', '1;31') + ' ' + style('[' + progressBar(5, 5) + '] 100%', '0;97'),
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '>> All stages complete',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      style('  ACCOUNT INFORMATION', '1;31'),
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      style('> USERNAME  :', '1;31') + ' ' + style(target.username, '0;97'),
      style('> USER ID   :', '1;31') + ' ' + style(target.id, '0;97'),
      style('> BOT ACC   :', '1;31') + ' ' + style((target.bot ? 'YES' : 'NO'), '0;97'),
      style('> CREATED   :', '1;31') + ' ' + style(createdAt, '0;97'),
      style('> ACC AGE   :', '1;31') + ' ' + style(accountAge, '0;97'),
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      style('  CURRENT ASSETS', '1;31'),
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      style('> AVATAR    :', '1;31') + ' ' + style(currentPFP, '0;97'),
      style('> BANNER    :', '1;31') + ' ' + style(currentBanner, '0;97'),
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      style('  HISTORY SUMMARY', '1;31'),
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      style('> PFP LOGS  :', '1;31') + ' ' + style(pfpHistory.length + ' tracked', '0;97'),
      style('> NAME LOGS :', '1;31') + ' ' + style(nameHistory.length + ' tracked', '0;97'),
      style('> BANNER LOG:', '1;31') + ' ' + style(bannerHistory.length + ' tracked', '0;97'),
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    ])).catch(async (err) => {
      await message.channel.send(formatAnsiBlock([style('> ❌ Error showing results: ' + err.message, '1;91')]));
    });

    // ---- PFP HISTORY ----
    if (pfpHistory.length > 0) {
      let pfpMsg = '**[ PFP HISTORY - ' + target.username + ' ]**\n';
      [...pfpHistory].reverse().forEach((entry, i) => {
        pfpMsg += '> **' + (i + 1) + '.** Changed on `' + formatDate(entry.changedAt) + '`\n';
        pfpMsg += '> ' + entry.url + '\n';
      });
      await message.channel.send(pfpMsg).catch(() => {});
    }

    // ---- NAME HISTORY ----
    if (nameHistory.length > 0) {
      let nameMsg = '**[ USERNAME HISTORY - ' + target.username + ' ]**\n';
      [...nameHistory].reverse().forEach((entry, i) => {
        nameMsg += '> **' + (i + 1) + '.** Was `' + entry.name + '` - Changed on `' + formatDate(entry.changedAt) + '`\n';
      });
      await message.channel.send(nameMsg).catch(() => {});
    }

    // ---- BANNER HISTORY ----
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