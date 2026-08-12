// ============================================
// FAKE DATA POOLS
// ============================================

const IPS = [
  // Generate realistic looking IPs in common ranges
];


const ENCRYPTION_TYPES = [
  "AES-256-GCM",
  "RSA-4096",
  "ChaCha20-Poly1305",
  "AES-128-CBC",
  "Blowfish-448"
];

const SCAN_STAGES = [
  "Initializing secure connection",
  "Locating target endpoint",
  "Decrypting device signature",
  "Extracting network information",
  "Compiling results"
];

// ============================================
// HELPER FUNCTIONS
// ============================================

function randNum(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateIP() {
  // Generate realistic looking IPs avoiding obvious fake ranges
  const ranges = [
    `${randNum(50, 100)}.${randNum(10, 255)}.${randNum(10, 255)}.${randNum(1, 254)}`,
    `${randNum(150, 200)}.${randNum(10, 255)}.${randNum(10, 255)}.${randNum(1, 254)}`,
    `${randNum(70, 90)}.${randNum(10, 255)}.${randNum(10, 255)}.${randNum(1, 254)}`,
  ];
  return rand(ranges);
}

function generatePort() {
  const commonPorts = [8080, 443, 3389, 22, 8443, 1194, 4444, 9050];
  return rand(commonPorts);
}

function generateMacAddress() {
  const hex = '0123456789ABCDEF';
  let mac = '';
  for (let i = 0; i < 6; i++) {
    mac += hex[randNum(0, 15)] + hex[randNum(0, 15)];
    if (i < 5) mac += ':';
  }
  return mac;
}

function generatePingMs() {
  return `${randNum(12, 89)}ms`;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Progress bar generator
function progressBar(current, total, size = 10) {
  const filled = Math.round((current / total) * size);
  const empty = size - filled;
  return `${'■'.repeat(filled)}${'□'.repeat(empty)}`;
}

export default {
  name: 'doxx',
  description: 'Doxxes the targetted victims.',
  aliases: ['rdox', 'dox', 'lookup'],
  usage: '[user mention/id]',
  category: 'general',
  type: 'both',
  permissions: [],
  cooldown: 30,
  async execute(client, message, args) {

    // Get target user
    let target = message.author;

    if (args.length > 0) {
      const mentioned = message.mentions.users.first();
      if (mentioned) {
        target = mentioned;
      } else {
        try {
          target = await client.users.fetch(args[0]);
        } catch {
          return message.channel.send('> ❌ Could not find that user!');
        }
      }
    }

    // Pre generate all fake data
    const fakeIP = generateIP();
    const fakeEncryption = rand(ENCRYPTION_TYPES);
    const fakeMAC = generateMacAddress();
    const fakePing = generatePingMs();
    const fakePort = generatePort();

    // ---- STAGE 1 - Initializing ----
    const scanMsg = await message.channel.send(formatAnsiBlock([
      style('[ Barro\'S DOXX TOOL v1.0 ]', '1;30'),
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      style('> TARGET    :', '1;31') + ' ' + style(target.username, '0;97'),
      style('> STATUS    :', '1;31') + ' ' + style('INITIALIZING', '0;97'),
      style('> PROGRESS  :', '1;31') + ' ' + style('[' + progressBar(0, 5) + '] 0%', '0;97'),
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '>> ' + SCAN_STAGES[0] + '...'
    ]));

    await sleep(2000);

    // ---- STAGE 2 - Locating ----
    await scanMsg.edit(formatAnsiBlock([
      style('[ Barro\'S DOXX TOOL v1.0 ]', '1;30'),
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      style('> TARGET    :', '1;31') + ' ' + style(target.username, '0;97'),
      style('> STATUS    :', '1;31') + ' ' + style('SCANNING', '0;97'),
      style('> PROGRESS  :', '1;31') + ' ' + style('[' + progressBar(1, 5) + '] 20%', '0;97'),
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '>> ' + SCAN_STAGES[0] + '... DONE',
      '>> ' + SCAN_STAGES[1] + '...'
    ]));

    await sleep(2500);

    // ---- STAGE 3 - Decrypting device ----
    await scanMsg.edit(formatAnsiBlock([
      style('[ Barro DOXX TOOL v1.0 ]', '1;30'),
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      style('> TARGET    :', '1;31') + ' ' + style(target.username, '0;97'),
      style('> STATUS    :', '1;31') + ' ' + style('DECRYPTING', '0;97'),
      style('> PROGRESS  :', '1;31') + ' ' + style('[' + progressBar(2, 5) + '] 40%', '0;97'),
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '>> ' + SCAN_STAGES[0] + '... DONE',
      '>> ' + SCAN_STAGES[1] + '... DONE',
      '>> ' + SCAN_STAGES[2] + '...',
      '>> Bypassing ' + fakeEncryption + ' encryption...'
    ]));

    await sleep(3000);

    // ---- STAGE 4 - Extracting IP ----
    await scanMsg.edit(formatAnsiBlock([
      style('[ Barro\'S DOXX TOOL v1.0 ]', '1;30'),
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      style('> TARGET    :', '1;31') + ' ' + style(target.username, '0;97'),
      style('> STATUS    :', '1;31') + ' ' + style('EXTRACTING', '0;97'),
      style('> PROGRESS  :', '1;31') + ' ' + style('[' + progressBar(3, 5) + '] 60%', '0;97'),
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '>> ' + SCAN_STAGES[0] + '... DONE',
      '>> ' + SCAN_STAGES[1] + '... DONE',
      '>> ' + SCAN_STAGES[2] + '... DONE',
      '>> ' + SCAN_STAGES[3] + '...',
      '>> Pinging endpoint... ' + fakePing
    ]));

    await sleep(2500);

    // ---- STAGE 5 - Compiling ----
    await scanMsg.edit(formatAnsiBlock([
      style('[ Barro\'S DOXX TOOL v1.0 ]', '1;30'),
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      style('> TARGET    :', '1;31') + ' ' + style(target.username, '0;97'),
      style('> STATUS    :', '1;31') + ' ' + style('COMPILING', '0;97'),
      style('> PROGRESS  :', '1;31') + ' ' + style('[' + progressBar(4, 5) + '] 80%', '0;97'),
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '>> ' + SCAN_STAGES[0] + '... DONE',
      '>> ' + SCAN_STAGES[1] + '... DONE',
      '>> ' + SCAN_STAGES[2] + '... DONE',
      '>> ' + SCAN_STAGES[3] + '... DONE',
      '>> ' + SCAN_STAGES[4] + '...'
    ]));

    await sleep(2000);

    // ---- FINAL RESULT ----
    await scanMsg.edit(formatAnsiBlock([
      style('[ Barro\'S DOXX TOOL v1.0 ]', '1;30'),
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      style('> TARGET    :', '1;31') + ' ' + style(target.username, '0;97'),
      style('> STATUS    :', '1;31') + ' ' + style('COMPLETE', '0;97'),
      style('> PROGRESS  :', '1;31') + ' ' + style('[' + progressBar(5, 5) + '] 100%', '0;97'),
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '>> ' + SCAN_STAGES[0] + '... DONE',
      '>> ' + SCAN_STAGES[1] + '... DONE',
      '>> ' + SCAN_STAGES[2] + '... DONE',
      '>> ' + SCAN_STAGES[3] + '... DONE',
      '>> ' + SCAN_STAGES[4] + '... DONE',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      style('  RESULTS', '1;31'),
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      style('> IP ADDR   :', '1;31') + ' ' + style(fakeIP, '0;97'),
      style('> PORT      :', '1;31') + ' ' + style(fakePort.toString(), '0;97'),
      style('> MAC ADDR  :', '1;31') + ' ' + style(fakeMAC, '0;97'),
      style('> PING      :', '1;31') + ' ' + style(fakePing, '0;97'),
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    ]));
  }
};

function style(text, colorCode) {
  return `\u001b[${colorCode}m${text}\u001b[0m`;
}

function formatAnsiBlock(lines) {
  return ['> ```ansi', ...lines.map(line => `> ${line}`), '> ```'].join('\n');
}