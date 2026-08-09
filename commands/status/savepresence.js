import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const DATA_PATH = resolve('./data/savedpresence.json');

function loadPresence() {
  try {
    return JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function savePresence(data) {
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

export default {
  name: 'savepresence',
  description: 'Save or load your rich presence so it survives restarts.',
  aliases: ['sp', 'presence'],
  usage: '[save | load | clear | view]',
  category: 'general',
  type: 'both',
  permissions: ['SendMessages'],
  cooldown: 3,
  async execute(client, message, args) {

    const sub = args[0]?.toLowerCase();
    const data = loadPresence();
    const userId = message.author.id;

    // ---- SAVE ----
    if (sub === 'save') {
      const presence = client.user.presence;

      if (!presence || !presence.activities.length) {
        return message.channel.send('> ❌ **Error:** No active rich presence found to save!');
      }

      const activity = presence.activities[0];

      data[userId] = {
        name: activity.name,
        type: activity.type,
        url: activity.url || null,
        details: activity.details || null,
        state: activity.state || null,
        largeImageKey: activity.assets?.largeImage || null,
        smallImageKey: activity.assets?.smallImage || null,
        startTimestamp: activity.timestamps?.start || null,
      };

      savePresence(data);
      return message.channel.send(`> ✅ Rich presence **"${activity.name}"** has been saved!`);

    // ---- LOAD ----
    } else if (sub === 'load') {
      const saved = data[userId];

      if (!saved) {
        return message.channel.send('> ❌ **Error:** No saved presence found! Use `+savepresence save` first.');
      }

      await client.user.setActivity(saved.name, {
        type: saved.type,
        url: saved.url,
        details: saved.details,
        state: saved.state,
        startTimestamp: saved.startTimestamp,
      });

      return message.channel.send(`> ✅ Rich presence **"${saved.name}"** has been loaded!`);

    // ---- CLEAR ----
    } else if (sub === 'clear') {
      delete data[userId];
      savePresence(data);
      await client.user.setActivity(null);
      return message.channel.send('> ✅ Rich presence cleared and removed from saves!');

    // ---- VIEW ----
    } else if (sub === 'view') {
      const saved = data[userId];

      if (!saved) {
        return message.channel.send('> ❌ No saved presence found!');
      }

      return message.channel.send(
        `> 📋 **Saved Presence:**\n` +
        `> Name: **${saved.name}**\n` +
        `> Type: **${saved.type}**\n` +
        `> Details: **${saved.details || 'None'}**\n` +
        `> State: **${saved.state || 'None'}**`
      );

    // ---- NO ARGS ----
    } else {
      return message.channel.send(
        `> ℹ️ **Presence Commands:**\n` +
        `> \`+savepresence save\` - Save current presence\n` +
        `> \`+savepresence load\` - Load saved presence\n` +
        `> \`+savepresence view\` - View saved presence info\n` +
        `> \`+savepresence clear\` - Clear saved presence`
      );
    }
  }
};