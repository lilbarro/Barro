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

// Jittered delay: returns base ± jitter (clamped to >= minMs).
// Real humans don't pause for exactly 3000ms; the millisecond-perfect
// pauses are a selfbot fingerprint.
function jitterSleep(baseMs, jitterMs = 0.3, minMs = 0) {
  const variance = baseMs * jitterMs;
  const ms = baseMs + (Math.random() * 2 - 1) * variance;
  return sleep(Math.max(minMs, Math.round(ms)));
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
    const m = Math.floor(days % 30);
    const d = days % 30;
    return y + 'y ' + m + 'm ' + d + 'd';
  } catch {
    return 'Unknown';
  }
}

// Builds a single key/value row like help.js categories: padded label, " | ", value
function kv(label, value, padTo) {
  const padded = String(label).padEnd(padTo, ' ');
  return style(padded, '1;34') + style(' | ', '0;34') + style(String(value), '0;97');
}

// Target description block — a separate code block that describes the target.
function targetBlock(target) {
  const LABEL_PAD = 10;
  return [
    style('Target', '0;30'),
    style('Name'.padEnd(LABEL_PAD, ' '), '1;34') + style(' | ', '0;34') + style(target.username, '0;97'),
    style('Id'.padEnd(LABEL_PAD, ' '), '1;34')   + style(' | ', '0;34') + style(target.id, '0;97'),
    style('Bot'.padEnd(LABEL_PAD, ' '), '1;34')   + style(' | ', '0;34') + style(target.bot ? 'Yes' : 'No', '0;97')
  ];
}

// Middle block — status row on top, centered progress bar on the bottom.
function statusBlock(status, percent) {
  const LABEL_PAD = 10;
  const filled = Math.round(percent / 20);
  const raw = '[' + progressBar(filled, 5) + '] ' + percent + '%';
  // Center the bar within a 46-char block width, like help.js's category column.
  const BLOCK_WIDTH = 46;
  const pad = Math.max(0, Math.floor((BLOCK_WIDTH - raw.length) / 2));
  const centered = ' '.repeat(pad) + raw;
  return [
    style('Status', '0;30'),
    style('Phase'.padEnd(LABEL_PAD, ' '), '1;34') + style(' | ', '0;34') + style(status, '0;97'),
    '',
    style(centered, '0;97')
  ];
}

// Per-target lockout: don't let the same account be osint-scanned more
// than once every 5 minutes. Prevents the "rapid osint across many
// users" pattern that looks like account-enumeration to Discord.
const recentOsint = new Map();
const PER_TARGET_LOCKOUT_MS = 5 * 60 * 1000;

function isOnPerTargetLockout(userId) {
  const last = recentOsint.get(userId);
  if (!last) return false;
  return (Date.now() - last) < PER_TARGET_LOCKOUT_MS;
}

function recordOsint(userId) {
  recentOsint.set(userId, Date.now());
}

// Periodic cleanup so the Map doesn't grow without bound.
setInterval(() => {
  const cutoff = Date.now() - PER_TARGET_LOCKOUT_MS;
  for (const [k, v] of recentOsint) {
    if (v < cutoff) recentOsint.delete(k);
  }
}, 60 * 1000).unref?.();

export default {
  name: 'osint',
  description: 'Runs a full OSINT scan on a Discord user.',
  aliases: ['scan', 'investigate'],
  usage: '[user id]',
  category: 'main',
  type: 'server_only', // DMs were triggering the "mass DM" anti-abuse rule.
  permissions: [],
  cooldown: 60,
  async execute(client, message, args) {

    // ---- DM BLOCK ----
    // Osint has no useful behaviour in a DM, and running it there counts
    // as outbound DMs from your account — which is exactly the signal in
    // the ban message ("Sending a large number of direct messages...").
    if (!message.guild) {
      return message.channel.send(formatAnsiBlock([
        style('> ❌ This command can only be used in a server, not in DMs.', '1;91')
      ]));
    }

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

    // ---- SELF-TARGET LOCKOUT ----
    if (isOnPerTargetLockout(target.id)) {
      const mins = Math.ceil((PER_TARGET_LOCKOUT_MS - (Date.now() - recentOsint.get(target.id))) / 60000);
      return message.channel.send(formatAnsiBlock([
        style(`> ⏳ That target was scanned recently. Try again in ~${mins}m.`, '1;33')
      ]));
    }
    recordOsint(target.id);

    // ---- FRIEND GATE ----
    // For non-friends, the "history" sections add no value (we already
    // friend-gated history loads in pass 1), and surfacing scan output
    // for randoms is what makes the account look like an enumeration
    // tool. We still allow the command for non-friends, but the output
    // is trimmed and the stage animation is shortened so the API
    // fingerprint is closer to "user looked up a profile" than
    // "script ran a 5-stage animation".
    const isFriend = (() => {
      try {
        const rel = client.relationships?.cache?.get(target.id);
        if (rel && rel.type === 'FRIEND') return true;
      } catch {}
      try {
        const special = client.config?.relationship_logs?.special_users;
        if (Array.isArray(special) && special.includes(target.id)) return true;
      } catch {}
      return false;
    })();

    // ---- STAGE TIMING ----
    // Old timings: 2.0s, 2.5s, 2.5s, 2.5s, 2.0s = 11.5s total + initial post
    //   = 6 messages (1 post + 5 edits) in ~11.5s. That sequence is a
    //   selfbot fingerprint.
    //
    // New timings: 14-26s per stage with 30% jitter, so 5 edits spread
    //   over ~95s instead of ~12s. That matches "user clicked through a
    //   slow loading UI" rather than "script looped tight".
    //
    // For non-friends we skip the stages entirely and post a single
    // profile card — that's a single API call instead of 6.
    if (!isFriend) {
      return emitSingleShotProfileCard(client, message, target);
    }

    const STAGES = [
      { status: 'Initializing', percent: 0,   header: 'Establishing secure connection', description: 'Opens a tunnel to Discord and verifies the target id is reachable.' },
      { status: 'Scanning',     percent: 20,  header: 'Fetching account information',   description: 'Pulls the public profile: name, id, created timestamp, flags.' },
      { status: 'Extracting',   percent: 40,  header: 'Extracting avatar history',      description: 'Loads the on-disk pfp log and lists every tracked avatar.' },
      { status: 'Decrypting',   percent: 60,  header: 'Decrypting username logs',       description: 'Walks the name history file and pairs each change with a date.' },
      { status: 'Compiling',    percent: 80,  header: 'Compiling final report',        description: 'Merges profile, assets, and history into the summary blocks.' }
    ];
    // Base stage delays (ms) — slowed from 2.0-2.5s to 14-26s, jittered.
    const stageSleeps = [18000, 22000, 24000, 26000, 18000];

    // Renders the Stages block: each stage as a blue header line + white description,
    // with a status suffix (Done / Active / Pending) on the right of the header.
    function stagesBlock(activeIdx) {
      const lines = [style('Stages', '0;30')];
      STAGES.forEach((stg, idx) => {
        const state = idx < activeIdx ? 'Done' : idx === activeIdx ? 'Active' : 'Pending';
        const tag = ' [' + state + ']';
        lines.push(style(`${idx + 1}. ${stg.header}`, '1;34') + style(tag, '0;34'));
        lines.push(style('   ' + stg.description, '0;97'));
      });
      return lines;
    }

    // ---- INITIAL POST ----
    let scanMsg;
    try {
      const block1 = formatAnsiBlock([style('Barro Osint Scanner', '1;34')]);
      const block2 = formatAnsiBlock(targetBlock(target));
      const block3 = formatAnsiBlock(statusBlock(STAGES[0].status, STAGES[0].percent));
      const block4 = formatAnsiBlock(stagesBlock(0));
      scanMsg = await message.channel.send([block1, block2, block3, block4].join('\n'));
    } catch (err) {
      return message.channel.send(formatAnsiBlock([style('Error: Error starting scan: ' + err.message, '1;94')]));
    }

    // ---- STAGE EDITS ----
    // Each edit is preceded by a jittered pause so the timing doesn't
    // look programmatic. The previous version slept *exactly* stageSleeps[i]
    // milliseconds every run — that's the giveaway.
    for (let i = 1; i < STAGES.length; i++) {
      await jitterSleep(stageSleeps[i - 1], 0.3, 8000); // min 8s per stage
      const s = STAGES[i];
      const block1 = formatAnsiBlock([style('Barro Osint Scanner', '1;34')]);
      const block2 = formatAnsiBlock(targetBlock(target));
      const block3 = formatAnsiBlock(statusBlock(s.status, s.percent));
      const block4 = formatAnsiBlock(stagesBlock(i));
      await scanMsg.edit([block1, block2, block3, block4].join('\n')).catch(() => {});
    }

    // Pause before final compile, matching the last stage base.
    await jitterSleep(stageSleeps[STAGES.length - 1], 0.3, 8000);

    // ---- ASSETS ----
    // The OLD code did a second `client.users.fetch(target.id, { force: true })`
    // after the stages — that was a redundant `GET /users/{id}` per osint run
    // and was one of the loudest "selfbot" signals (script refreshing user
    // data it already has). Removed entirely: the `target` we got from
    // mention / initial fetch already has avatar + banner URLs.
    const currentPFP = (() => {
      try { return target.displayAvatarURL({ dynamic: true, size: 1024 }); }
      catch { return 'UNAVAILABLE'; }
    })();
    const currentBanner = (() => {
      try { return target.bannerURL({ dynamic: true, size: 1024 }) || 'NONE'; }
      catch { return 'NONE'; }
    })();

    // Shortens a Discord CDN URL to "<host>/…<last8>" so the final embed
    // doesn't blow past Discord's 2000-char limit on long asset hashes.
    function shortUrl(url) {
      if (!url || url === 'NONE' || url === 'UNAVAILABLE') return url;
      try {
        const u = new URL(url);
        const path = u.pathname;
        const tail = path.slice(-8);
        return u.host + '/…' + tail;
      } catch {
        return url;
      }
    }

    // ---- LOAD HISTORY (friend-only, already gated above) ----
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
    const block1 = formatAnsiBlock([style('Barro Osint Scanner', '1;34')]);
    const block2 = formatAnsiBlock(targetBlock(target));
    const block3 = formatAnsiBlock(statusBlock('Complete', 100));
    const block4 = formatAnsiBlock(stagesBlock(STAGES.length));

    const accountBlock = formatAnsiBlock([
      style('Account information', '0;30'),
      kv('User id',   target.id, 10),
      kv('Bot',       target.bot ? 'Yes' : 'No', 10),
      kv('Created',   createdAt, 10),
      kv('Acc age',   accountAge, 10)
    ]);

    const assetsBlock = formatAnsiBlock([
      style('Current assets', '0;30'),
      kv('Avatar', shortUrl(currentPFP), 10),
      kv('Banner', shortUrl(currentBanner), 10)
    ]);

    const historyBlock = formatAnsiBlock([
      style('History summary', '0;30'),
      kv('Pfp logs',   pfpHistory.length   + ' tracked', 10),
      kv('Name logs',  nameHistory.length  + ' tracked', 10),
      kv('Banner log', bannerHistory.length + ' tracked', 10)
    ]);

    const usageBlock = formatAnsiBlock([
      style('Footer:', '1;34') + ' ' + style('History details sent in follow-up messages', '0;97'),
      style('Cooldown:', '1;34') + ' ' + style('60s', '0;97')
    ]);

    await scanMsg.edit(
      [block1, block2, block3, block4, accountBlock, assetsBlock, historyBlock, usageBlock].join('\n')
    ).catch(async (err) => {
      await message.channel.send(formatAnsiBlock([style('Error: Error showing results: ' + err.message, '1;94')]));
    });

    // ---- HISTORY FOLLOW-UPS ----
    // Old code sent up to THREE separate channel.send posts in quick
    // succession (pfp, name, banner). That sequence — one initial post +
    // five edits + three follow-ups in ~15s — is what makes the
    // command look like a selfbot. New behaviour:
    //   * Coalesce all three history sections into a SINGLE follow-up
    //     message when there's at least one history record.
    //   * Precede that single post with a jittered delay so it doesn't
    //     land the same millisecond as the final edit.
    const hasHistory = pfpHistory.length || nameHistory.length || bannerHistory.length;
    if (hasHistory) {
      await jitterSleep(8000, 0.4, 4000); // 4-12s pause before follow-up
      const lines = [style(`History details — ${target.username}`, '1;34')];
      if (pfpHistory.length) {
        lines.push(style('• Avatar changes:', '1;34'));
        [...pfpHistory].reverse().forEach((entry, i) => {
          lines.push(style(`    ${i + 1}. ${formatDate(entry.changedAt)} — ${entry.url}`, '0;97'));
        });
      }
      if (nameHistory.length) {
        lines.push(style('• Username changes:', '1;34'));
        [...nameHistory].reverse().forEach((entry, i) => {
          lines.push(style(`    ${i + 1}. ${entry.name} (${formatDate(entry.changedAt)})`, '0;97'));
        });
      }
      if (bannerHistory.length) {
        lines.push(style('• Banner changes:', '1;34'));
        [...bannerHistory].reverse().forEach((entry, i) => {
          lines.push(style(`    ${i + 1}. ${formatDate(entry.changedAt)} — ${entry.url}`, '0;97'));
        });
      }
      await message.channel.send(formatAnsiBlock(lines)).catch(() => {});
    }

  }
};

// Single-shot profile card for non-friends: one message, no edits,
// no animation. Matches "user looked up a profile", not "script
// fired 6+ API calls in 12s".
async function emitSingleShotProfileCard(client, message, target) {
  const createdAt = formatDate(target.createdTimestamp);
  const accountAge = getAccountAge(target.createdTimestamp);

  const currentPFP = (() => {
    try { return target.displayAvatarURL({ dynamic: true, size: 1024 }); }
    catch { return 'UNAVAILABLE'; }
  })();
  const currentBanner = (() => {
    try { return target.bannerURL?.({ dynamic: true, size: 1024 }) || 'NONE'; }
    catch { return 'NONE'; }
  })();

  function shortUrl(url) {
    if (!url || url === 'NONE' || url === 'UNAVAILABLE') return url;
    try {
      const u = new URL(url);
      return u.host + '/…' + u.pathname.slice(-8);
    } catch { return url; }
  }

  const block1 = formatAnsiBlock([style('Barro Osint Scanner', '1;34')]);
  const block2 = formatAnsiBlock(targetBlock(target));
  const block3 = formatAnsiBlock(statusBlock('Complete', 100));
  const accountBlock = formatAnsiBlock([
    style('Account information', '0;30'),
    kv('User id',   target.id, 10),
    kv('Bot',       target.bot ? 'Yes' : 'No', 10),
    kv('Created',   createdAt, 10),
    kv('Acc age',   accountAge, 10)
  ]);
  const assetsBlock = formatAnsiBlock([
    style('Current assets', '0;30'),
    kv('Avatar', shortUrl(currentPFP), 10),
    kv('Banner', shortUrl(currentBanner), 10)
  ]);
  const note = formatAnsiBlock([
    style('Note:', '1;33') + ' ' + style('History is only available for friends.', '0;97')
  ]);

  return message.channel.send([block1, block2, block3, accountBlock, assetsBlock, note].join('\n'));
}

function style(text, colorCode) {
  return `[${colorCode}m${text}[0m`;
}

function formatAnsiBlock(lines) {
  return ['> ```ansi', ...lines.map(line => `> ${line}`), '> ```'].join('\n');
}