import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const DATA_PATH = resolve('./data/pfphistory.json');

function loadHistory() {
  try {
    return JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function saveHistory(data) {
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

// Auto-track pfp changes (call this in your ready event or index.js)
export function trackPfpChange(client) {
  client.on('userUpdate', (oldUser, newUser) => {
    if (oldUser.avatar !== newUser.avatar) {
      const data = loadHistory();
      if (!data[newUser.id]) data[newUser.id] = [];

      data[newUser.id].push({
        url: oldUser.displayAvatarURL({ dynamic: true, size: 1024 }),
        changedAt: new Date().toISOString(),
      });

      // Keep only last 10 pfps
      if (data[newUser.id].length > 10) {
        data[newUser.id] = data[newUser.id].slice(-10);
      }

      saveHistory(data);
    }
  });
}

export default {
  name: 'userinfo',
  description: 'Shows info about a user + their pfp history.',
  aliases: ['ui', 'whois', 'pfphistory'],
  usage: '[user mention/id] [history?]',
  category: 'general',
  type: 'both',
  permissions: ['SendMessages'],
  cooldown: 5,
  async execute(client, message, args) {

    // Find target user
    let target = message.author;

    if (args.length > 0 && args[0].toLowerCase() !== 'history') {
      const mentioned = message.mentions.users.first();
      if (mentioned) {
        target = mentioned;
      } else {
        // Try by ID
        try {
          target = await client.users.fetch(args[0]);
        } catch {
          return message.channel.send('> ❌ **Error:** Could not find that user!');
        }
      }
    }

    // Fetch full user profile (for banner etc)
    let fullUser;
    try {
      fullUser = await client.users.fetch(target.id, { force: true });
    } catch {
      fullUser = target;
    }

    const data = loadHistory();
    const history = data[target.id] || [];

    // Show history if requested
    if (args.includes('history')) {
      if (history.length === 0) {
        return message.channel.send(`> ❌ No pfp history found for **${target.username}**!\n> History is only tracked after the bot is running and they change their pfp.`);
      }

      const historyList = history
        .reverse()
        .map((entry, i) => `> **${i + 1}.** [PFP Link](${entry.url}) - Changed <t:${Math.floor(new Date(entry.changedAt).getTime() / 1000)}:R>`)
        .join('\n');

      return message.channel.send(
        `> 🖼️ **PFP History for ${target.username}** (Last ${history.length}):\n${historyList}`
      );
    }

    // ---- MAIN USERINFO ----
    const createdAt = Math.floor(target.createdTimestamp / 1000);
    const avatarURL = fullUser.displayAvatarURL({ dynamic: true, size: 1024 });
    const bannerURL = fullUser.bannerURL?.({ dynamic: true, size: 1024 }) || null;

    // Guild specific info
    let joinedAt = null;
    let roles = null;
    let nickname = null;

    if (message.guild) {
      try {
        const member = await message.guild.members.fetch(target.id);
        joinedAt = Math.floor(member.joinedTimestamp / 1000);
        nickname = member.nickname || null;
        roles = member.roles.cache
          .filter(r => r.name !== '@everyone')
          .map(r => `\`${r.name}\``)
          .join(', ') || 'None';
      } catch {
        // User not in this guild, skip
      }
    }

    let info =
      `> 👤 **User Info: ${target.username}**\n` +
      `> ━━━━━━━━━━━━━━━━━━\n` +
      `> 🏷️ **Tag:** ${target.tag || target.username}\n` +
      `> 🆔 **ID:** ${target.id}\n` +
      `> 🤖 **Bot:** ${target.bot ? 'Yes' : 'No'}\n` +
      `> 📅 **Account Created:** <t:${createdAt}:F> (<t:${createdAt}:R>)\n`;

    if (nickname) info += `> 😄 **Nickname:** ${nickname}\n`;
    if (joinedAt) info += `> 📥 **Joined Server:** <t:${joinedAt}:F> (<t:${joinedAt}:R>)\n`;
    if (roles) info += `> 🎭 **Roles:** ${roles}\n`;

    info += `> ━━━━━━━━━━━━━━━━━━\n`;
    info += `> 🖼️ **Current PFP:** [Click Here](${avatarURL})\n`;

    if (bannerURL) {
      info += `> 🎨 **Banner:** [Click Here](${bannerURL})\n`;
    }

    if (history.length > 0) {
      info += `> 📚 **PFP History:** ${history.length} saved | Use \`+userinfo @user history\` to view\n`;
    } else {
      info += `> 📚 **PFP History:** None tracked yet\n`;
    }

    // Send pfp as image + info
    await message.channel.send(info);
    await message.channel.send({ files: [avatarURL] });

    if (bannerURL) {
      await message.channel.send({ files: [bannerURL] });
    }
  }
};