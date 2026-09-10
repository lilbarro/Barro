import { THEME } from "../../utils/theme.js";
import { formatHeaderTitle, formatAnsiBlocks } from "../../utils/functions.js";

const IPS = [];
const ENCRYPTION_TYPES = ["AES-256-GCM", "RSA-4096", "ChaCha20-Poly1305", "AES-128-CBC", "Blowfish-448"];
const SCAN_STAGES = ["Initializing secure connection", "Locating target endpoint", "Decrypting device signature", "Extracting network information", "Compiling results"];

function randNum(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function generateIP() {
  return rand([
    `${randNum(50, 100)}.${randNum(10, 255)}.${randNum(10, 255)}.${randNum(1, 254)}`,
    `${randNum(150, 200)}.${randNum(10, 255)}.${randNum(10, 255)}.${randNum(1, 254)}`,
    `${randNum(70, 90)}.${randNum(10, 255)}.${randNum(10, 255)}.${randNum(1, 254)}`
  ]);
}
function generatePort() { return rand([8080, 443, 3389, 22, 8443, 1194, 4444, 9050]); }
function generateMacAddress() {
  const hex = '0123456789ABCDEF'; let mac = '';
  for (let i = 0; i < 6; i++) { mac += hex[randNum(0, 15)] + hex[randNum(0, 15)]; if (i < 5) mac += ':'; }
  return mac;
}
function generatePingMs() { return `${randNum(12, 89)}ms`; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function progressBar(current, total, size = 10) { const filled = Math.round((current / total) * size); return `${'â– '.repeat(filled)}${'â–¡'.repeat(size - filled)}`; }

export default {
  name: 'doxx', description: 'Scan simulated target information', aliases: ['rdox', 'dox', 'lookup'], usage: '[user mention/id]', category: 'troll', type: 'both', permissions: [], cooldown: 5,
  async execute(client, message, args) {
    if (args[0] && ['help', '--help', '-h'].includes(args[0].toLowerCase())) {
      return message.channel.send(formatAnsiBlocks([
        [formatHeaderTitle('Barro Doxx')],
        [style('Usage', THEME.HEADER_BOLD_COLOR), style(`${client.prefix}doxx [user/id]`, THEME.ACCENT_COLOR)],
        [style('Aliases', THEME.HEADER_BOLD_COLOR), style(`${client.prefix}rdox | ${client.prefix}dox | ${client.prefix}lookup`, THEME.ACCENT_COLOR)]
      ]));
    }
    let target = message.author;
    if (args.length > 0) {
      const mentioned = message.mentions.users.first();
      if (mentioned) target = mentioned;
      else { try { target = await client.users.fetch(args[0]); } catch { return message.channel.send('> âŒ Could not find that user!'); } }
    }
    const fakeIP = generateIP(), fakeEncryption = rand(ENCRYPTION_TYPES), fakeMAC = generateMacAddress(), fakePing = generatePingMs(), fakePort = generatePort();
    const scanMsg = await message.channel.send(renderDoxView('Initializing', 0, target, fakeIP, fakeMAC, fakePing, fakePort));
    await sleep(2000); await scanMsg.edit(renderDoxView('Scanning', 1, target, fakeIP, fakeMAC, fakePing, fakePort));
    await sleep(2500); await scanMsg.edit(renderDoxView('Decrypting', 2, target, fakeIP, fakeMAC, fakePing, fakePort, fakeEncryption));
    await sleep(3000); await scanMsg.edit(renderDoxView('Extracting', 3, target, fakeIP, fakeMAC, fakePing, fakePort));
    await sleep(2500); await scanMsg.edit(renderDoxView('Compiling', 4, target, fakeIP, fakeMAC, fakePing, fakePort));
    await sleep(2000); await scanMsg.edit(renderDoxView('Complete', 5, target, fakeIP, fakeMAC, fakePing, fakePort));
  }
};

function renderDoxView(stageName, stageIndex, target, fakeIP, fakeMAC, fakePing, fakePort, fakeEncryption = '') {
  const progressMap = ['0%', '20%', '40%', '60%', '80%', '100%'];
  const stageColor = stageName === 'Complete' ? '1;32' : '1;33';
  const topBlockLines = [formatHeaderTitle('Barro Doxx') + style(' | ', '0;30') + style(stageName, stageColor)];
  const statusBlockLines = [
    style('Status', THEME.HEADER_BOLD_COLOR),
    kv('Target', target.username || 'Unknown', 10),
    kv('Phase', stageName, 10),
    kv('Progress', progressMap[stageIndex] || '100%', 10),
    style(SCAN_STAGES[Math.min(stageIndex, SCAN_STAGES.length - 1)], THEME.LABEL_COLOR)
  ];
  const resultBlockLines = stageName === 'Complete'
    ? [style('Results', THEME.HEADER_BOLD_COLOR), kv('IP', fakeIP, 10), kv('Port', fakePort, 10), kv('MAC', fakeMAC, 10), kv('Ping', fakePing, 10), kv('Encryption', fakeEncryption || 'AES', 10)]
    : [style('Results', THEME.HEADER_BOLD_COLOR), kv('IP', 'Pending', 10), kv('Port', 'Pending', 10), kv('MAC', 'Pending', 10), kv('Ping', 'Pending', 10)];
  return formatAnsiBlocks([topBlockLines, statusBlockLines, resultBlockLines]);
}
function style(text, colorCode) { return `\u001b[${colorCode}m${text}\u001b[0m`; }
function kv(label, value, padTo) { return style(String(label).padEnd(padTo, ' '), '37') + style(' | ', '0;30') + style(String(value), THEME.ACCENT_COLOR); }
