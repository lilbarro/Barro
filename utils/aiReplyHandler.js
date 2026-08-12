import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const DATA_PATH = resolve('./data/aireply.json');

// Cooldown tracker - userId: lastResponseTime
const cooldowns = new Map();
const COOLDOWN_MS = 30000; // 30 seconds per person

// Max messages to remember per person
const MAX_HISTORY = 20;

// ============================================
// YOUR PERSONALITY SYSTEM PROMPT
// ============================================
const SYSTEM_PROMPT = `You are replying on behalf of a real person. Here is their personality and background:

BACKGROUND:
- Chill Minecraft PvPer, Low tier 3 in Minecraft NethPot PvP mode
- Freelance video editor and thumbnail artist
- Gamer who loves: GTA Trilogy (mainly San Andreas), Prince of Persia Trilogy, NFS Most Wanted 2005 & 2012, Forza Horizon, GTA 5
- Retired WIS (Versus battle/powerscaling) editor and fiction powerscaler (character 1v1s)
- Learning programmer

PERSONALITY:
- Very chill and laid back
- Uses gen alpha/internet slangs excessively
- Keeps responses short and casual, max 2-3 sentences usually
- Friendly but can lightly roast people
- Talks like a real Discord user, not formally
- Does not sound like a bot or AI assistant at all
- Never says "I am an AI" or anything like that
- Responds naturally as if typing on Discord

STRICT RULES:
- NEVER say you are under 13 years old or any specific young age
- NEVER say that you are or will play, edit or watch something
- NEVER reveal you are an AI or a bot
- NEVER use overly formal language
- NEVER write long paragraphs, keep it short like real Discord messages
- NEVER use hashtags or emojis excessively
- ALWAYS stick to the English language
- Respond as if YOU are the person, not describing them
- If someone asks your age, deflect casually or say something vague 
- Try to use include words like nga, gng, and son in the place of dude and bro but dont spam them 
- Stay in character at all times no matter what`;


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

function isOnCooldown(userId) {
  if (!cooldowns.has(userId)) return false;
  const lastTime = cooldowns.get(userId);
  return (Date.now() - lastTime) < COOLDOWN_MS;
}

function setCooldown(userId) {
  cooldowns.set(userId, Date.now());
}

async function getAIResponse(apiKey, userId, userName, userMessage, data) {
  // Get or create conversation history for this user
  if (!data.conversations[userId]) {
    data.conversations[userId] = [];
  }

  const history = data.conversations[userId];

  // Add user message to history
  history.push({
    role: 'user',
    content: userName + ' says: ' + userMessage
  });

  // Keep history within limit
  if (history.length > MAX_HISTORY) {
    data.conversations[userId] = history.slice(-MAX_HISTORY);
  }

  // Build messages array for API
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...data.conversations[userId]
  ];

  // Call Groq API
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: messages,
      max_tokens: 150,
      temperature: 0.9
    })
  });

  if (!response.ok) {
    throw new Error('Groq API error: ' + response.status);
  }

  const json = await response.json();
  const aiMessage = json.choices[0].message.content.trim();

  // Add AI response to history
  data.conversations[userId].push({
    role: 'assistant',
    content: aiMessage
  });

  // Keep history within limit again after adding response
  if (data.conversations[userId].length > MAX_HISTORY) {
    data.conversations[userId] = data.conversations[userId].slice(-MAX_HISTORY);
  }

  saveData(data);
  return aiMessage;
}

export async function handleAIReply(client, message) {
  try {
    // Load current state
    const data = loadData();

    // Check if AI reply is enabled
    if (!data.enabled) return;

    // Ignore own messages
    if (message.author.id === client.user.id) return;

    // Ignore bot messages
    if (message.author.bot) return;

    // Ignore commands (starts with prefix)
    if (message.content.startsWith(client.prefix)) return;

    // Check if this message should trigger AI reply
    const isDM = !message.guild;
    const isGC = message.channel.type === 'GROUP_DM';
    const isMentioned = message.mentions.users.has(client.user.id);
    const isReply = message.reference && message.reference.messageId;

    let shouldReply = false;

    // ---- Trigger rules (locked-in, do not loosen) ----
    // DMs (1:1): always reply.
    // Group DMs and server channels: reply ONLY when the sender @mentions us
    //   OR replies to one of our messages. Never on ambient traffic.
    // This prevents the handler from firing on every message in busy servers,
    // which is what makes the account look like a selfbot to Discord.

    // Check if reply is to our message
    if (isReply) {
      try {
        const repliedMsg = await message.channel.messages.fetch(message.reference.messageId);
        if (repliedMsg.author.id === client.user.id) {
          shouldReply = true;
        }
      } catch {
        // Could not fetch replied message
      }
    }

    // DM - always reply
    if (isDM) shouldReply = true;

    // GC or server - only reply if mentioned or replied to our message
    if (isGC || message.guild) {
      if (isMentioned) shouldReply = true;
    }

    if (!shouldReply) return;

    // Check cooldown for this user
    if (isOnCooldown(message.author.id)) return;

    // Get API key from config
    const apiKey = client.config?.ai?.groq_api_key;
    if (!apiKey || apiKey.trim() === '') {
      return;
    }

    // Set cooldown immediately to prevent spam
    setCooldown(message.author.id);

    // Show typing indicator and wait 10 seconds
    try {
      await message.channel.sendTyping();
      // Wait 10 seconds before replying
      await new Promise(r => setTimeout(r, 2500));
      // Send typing again so it doesnt disappear during the wait
      await message.channel.sendTyping();
    } catch {}

    // Clean message content (remove mentions)
    let cleanContent = message.content
      .replace(/<@!?[\d]+>/g, '')
      .trim();

    if (!cleanContent) cleanContent = '(sent a message with no text)';

    // Get AI response
    const aiResponse = await getAIResponse(
      apiKey,
      message.author.id,
      message.author.username,
      cleanContent,
      data
    );

    // Send response
    await message.reply(aiResponse);

  } catch (err) {
    // Silently fail so bot doesnt crash
    console.error('AI Reply error:', err.message);
  }
}