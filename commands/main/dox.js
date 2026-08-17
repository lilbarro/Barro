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

function progressBar(current, total, size = 10) {
  const filled = Math.round((current / total) * size);
  const empty = size - filled;
  return `${'â– '.repeat(filled)}${'â–¡'.repeat(empty)}`;
}

export default {
  name: 'doxx',
  description: 'Doxxes the targetted victims.',
  aliases: ['rdox', 'dox', 'lookup'],
  usage: '[user mention/id]',
  category: 'general',
  type: 'both',
  permissions: [],
  cooldown: 5,
  async execute(client, message, args) {
    let target = message.author;

    if (args.length > 0) {
      const mentioned = message.mentions.users.first();
      if (mentioned) {
        target = mentioned;
      } else {
        try {
          target = await client.users.fetch(args[0]);
        } catch {
          return message.channel.send('> âŒ Could not find that user!');
        }
      }
    }

    const fakeIP = generateIP();
    const fakeEncryption = rand(ENCRYPTION_TYPES);
    const fakeMAC = generateMacAddress();
    const fakePing = generatePingMs();
    const fakePort = generatePort();

    const scanMsg = await message.channel.send(renderDoxView('Initializing', 0, target, fakeIP, fakeMAC, fakePing, fakePort));

    await sleep(2000);
    await scanMsg.edit(renderDoxView('Scanning', 1, target, fakeIP, fakeMAC, fakePing, fakePort));

    await sleep(2500);
    await scanMsg.edit(renderDoxView('Decrypting', 2, target, fakeIP, fakeMAC, fakePing, fakePort, fakeEncryption));

    await sleep(3000);
    await scanMsg.edit(renderDoxView('Extracting', 3, target, fakeIP, fakeMAC, fakePing, fakePort));

    await sleep(2500);
    await scanMsg.edit(renderDoxView('Compiling', 4, target, fakeIP, fakeMAC, fakePing, fakePort));

    await sleep(2000);
    await scanMsg.edit(renderDoxView('Complete', 5, target, fakeIP, fakeMAC, fakePing, fakePort));
  }
};

function renderDoxView(stageName, stageIndex, target, fakeIP, fakeMAC, fakePing, fakePort, fakeEncryption = '') {
  const progressMap = ['0%', '20%', '40%', '60%', '80%', '100%'];
  const stageColor = stageName === 'Complete' ? '1;32' : '1;33';

  const topBlock = formatAnsiBlock([
    style('Barro v1.5', '4;30') + style(' Doxx Tool', '0;34') + style(' | ', '0;30') + style(stageName, stageColor),
    kv('Target', target.username, 12),
    '',
    style('Status', '0;30'),
    kv('Phase', stageName, 12),
    kv('Progress', progressMap[stageIndex] || '100%', 12)
  ]);

  const stageBlockLines = [
    style('Stages', '0;30'),
    style(`>> ${SCAN_STAGES[Math.min(stageIndex, SCAN_STAGES.length - 1)]}...`, '0;97')
  ];

  const stageBlock = formatAnsiBlock(stageBlockLines);

  const resultBlockLines = stageName === 'Complete'
    ? [
        style('Results', '0;30'),
        kv('IP Address', fakeIP, 12),
        kv('Port', fakePort.toString(), 12),
        kv('MAC Address', fakeMAC, 12),
        kv('Ping', fakePing, 12)
      ]
    : [
        style('Results', '0;30'),
        kv('IP Address', 'Pending', 12),
        kv('Port', 'Pending', 12),
        kv('MAC Address', 'Pending', 12),
        kv('Ping', 'Pending', 12)
      ];

  const resultBlock = formatAnsiBlock(resultBlockLines);

  return [topBlock, stageBlock, resultBlock].join('\n\n');
}

function style(text, colorCode) {
  return `\u001b[${colorCode}m${text}\u001b[0m`;
}

function formatAnsiBlock(lines) {
  return ['> ```ansi', ...lines.map(line => `> ${line}`), '> ```'].join('\n');
}

function kv(label, value, padTo) {
  const padded = String(label).padEnd(padTo, ' ');
  return style(padded, '0;97') + style(' | ', '0;30') + style(String(value), '0;34');
}
