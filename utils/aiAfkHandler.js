import { loadConfig, log } from "./functions.js";

export const afkSessions = new Map();
const mentionLog = new Map();

export function getMentionLog(userId) {
  return mentionLog.get(userId) || [];
}

export function clearSession(userId) {
  afkSessions.delete(userId);
  mentionLog.delete(userId);
  for (const key of conversations.keys()) {
    if (key.startsWith(userId + ':')) conversations.delete(key);
  }
}
const conversations = new Map();
const cooldowns = new Map();
const recentAiMessages = new Map();
const COOLDOWN_MS = 5000;

export function formatDuration(ms) {
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) return hrs + 'h ' + (mins % 60) + 'm';
  if (mins > 0) return mins + 'm ' + (secs % 60) + 's';
  return secs + 's';
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function isOnCooldown(senderId) {
  if (!cooldowns.has(senderId)) return false;
  return (Date.now() - cooldowns.get(senderId)) < COOLDOWN_MS;
}

function setCooldown(senderId) {
  cooldowns.set(senderId, Date.now());
}

function getHistory(afkUserId, senderId, channelId) {
  const key = afkUserId + ':' + senderId + ':' + channelId;
  if (!conversations.has(key)) conversations.set(key, []);
  return conversations.get(key);
}

function addToHistory(afkUserId, senderId, channelId, userMsg, aiMsg) {
  const key = afkUserId + ':' + senderId + ':' + channelId;
  const history = getHistory(afkUserId, senderId, channelId);
  history.push({ role: 'user', content: userMsg });
  history.push({ role: 'assistant', content: aiMsg });
  if (history.length > 20) {
    conversations.set(key, history.slice(-20));
  }
}

function buildSystemPrompt(userName, reason, cfg) {
  const ui = cfg.user_info || {};
  const instructions = cfg.instructions || '';
  return instructions.trim() + '\n\n' +
    'You are an AI assistant responding on behalf of ' + userName + ' who is currently AFK on Discord.\n' +
    'AFK Reason: ' + (reason || 'No reason given') + '\n\n' +
    'USER BACKGROUND:\n' +
    (ui.details ? '- ' + ui.details + '\n' : '') +
    (ui.background ? '- ' + ui.background + '\n' : '') +
    (ui.additional_info ? '- ' + ui.additional_info + '\n' : '') +
    '\nRULES:\n' +
    '1. Write in lowercase only\n' +
    '2. Keep replies short 2-3 sentences max\n' +
    '3. Never reveal you are an AI or which model powers you\n' +
    '4. Never say you or the user are under 13 years old\n' +
    '5. Make it clear the user is AFK but be helpful\n' +
    '6. Only greet on first message skip greetings on follow ups\n' +
    '7. Respond naturally like a real Discord user\n' +
    '8. You are ' + userName + ' assistant not ' + userName + ' themselves';
}

async function callGroq(apiKey, messages) {
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
      temperature: 0.85
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error('Groq API error: ' + response.status + ' - ' + err);
  }

  const json = await response.json();
  return json.choices[0].message.content.trim();
}

async function generateResponse(afkUserId, senderId, channelId, userMessage, cfg) {
  const apiKey = loadConfig()?.ai?.groq_api_key;
  if (!apiKey || !apiKey.trim()) throw new Error('No Groq API key configured');

  const session = afkSessions.get(afkUserId);
  const userName = session?.userName || 'the user';
  const reason = session?.reason || 'no reason given';
  const systemPrompt = buildSystemPrompt(userName, reason, cfg);
  const history = getHistory(afkUserId, senderId, channelId);
  const isFirst = history.length === 0;

  const userContent = userMessage +
    (isFirst ? '\n\n[first message - brief natural greeting is ok]' :
      '\n\n[follow up - do not greet again]');

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userContent }
  ];

  const aiResponse = await callGroq(apiKey, messages);
  addToHistory(afkUserId, senderId, channelId, userMessage, aiResponse);
  return aiResponse;
}

export async function handleAiAfkMessage(client, message) {
  try {
    const cfg = loadConfig()?.ai_afk;
    if (!cfg || !cfg.enabled) return;

    const authorId = message.author.id;
    const channelId = message.channel.id;


    // ---- SKIP BOTS ----
    if (message.author.bot) return;

    // ---- SKIP MASS MENTIONS ----
    if (message.mentions.everyone || message.content.includes('@here')) return;

    // ---- FIND TARGETED AFK USER ----
    const targeted = new Set();

    for (const user of message.mentions.users.values()) {
      if (afkSessions.has(user.id)) targeted.add(user.id);
    }

    if (!message.guild) {
      for (const id of afkSessions.keys()) {
        if (id !== authorId) targeted.add(id);
      }
    }

    if (message.reference) {
      try {
        const replied = await message.channel.messages.fetch(message.reference.messageId);
        if (replied.author.id !== authorId && afkSessions.has(replied.author.id)) {
          targeted.add(replied.author.id);
        }
      } catch {}
    }

    if (targeted.size === 0) return;

    // ---- COOLDOWN ----
    if (isOnCooldown(authorId)) return;
    setCooldown(authorId);

    // ---- PROCESS EACH TARGETED AFK USER ----
    for (const afkUserId of targeted) {
      try {
        const senderName = message.member?.displayName || message.author.username;
        const userMessage = message.content || '(no text)';

        if (!mentionLog.has(afkUserId)) mentionLog.set(afkUserId, []);
        mentionLog.get(afkUserId).push({
          senderName,
          content: userMessage,
          timestamp: Date.now(),
          channelId
        });

        await message.channel.sendTyping().catch(() => {});
        await sleep(3000);
        await message.channel.sendTyping().catch(() => {});

        const aiResponse = await generateResponse(
          afkUserId, authorId, channelId,
          userMessage, cfg
        );

        if (!recentAiMessages.has(afkUserId)) recentAiMessages.set(afkUserId, new Set());
        const cached = recentAiMessages.get(afkUserId);
        cached.add(aiResponse.trim());
        setTimeout(() => cached.delete(aiResponse.trim()), 5000);

        await message.reply({
          content: aiResponse,
          allowedMentions: { repliedUser: true }
        }).catch(async () => {
          await message.channel.send(aiResponse).catch(() => {});
        });

      } catch (err) {
        log('AI AFK error: ' + err.message, 'warn');
      }
    }

  } catch (err) {
    log('AI AFK handler error: ' + err.message, 'warn');
  }
}