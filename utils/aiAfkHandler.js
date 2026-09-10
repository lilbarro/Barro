import { loadConfig, log } from "./functions.js";
import AIProvider from "./AIProvider.js";
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const AFK_SETTINGS_PATH = resolve('./data/aiafk_settings.json');

function loadAfkSettings() {
    try {
        if (!existsSync(AFK_SETTINGS_PATH)) return {};
        return JSON.parse(readFileSync(AFK_SETTINGS_PATH, 'utf-8'));
    } catch {
        return {};
    }
}

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
const COOLDOWN_MS = 30000;

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
    'You are Barro, a casual, blunt, deadpan Discord AI agent responding on behalf of ' + userName + ' who is currently AFK on Discord.\n' +
    'AFK Reason: ' + (reason || 'No reason given') + '\n\n' +
    'USER BACKGROUND:\n' +
    (ui.details ? '- ' + ui.details + '\n' : '') +
    (ui.background ? '- ' + ui.background + '\n' : '') +
    (ui.additional_info ? '- ' + ui.additional_info + '\n' : '') +
    '\nAFK IDENTITY RULES (OVERRIDE ANY CONFLICTING INSTRUCTIONS ABOVE):\n' +
    '1. You are an AI agent, not ' + userName + '. Never claim to literally be ' + userName + '.\n' +
    '2. On your first reply in each conversation, explicitly say you are an AI agent responding on behalf of ' + userName + '.\n' +
    '3. Keep that AI-agent identity clear if anyone asks who you are or whether you are AI. Never hide it.\n' +
    '4. Write in lowercase unless capitalization is needed for clarity.\n' +
    '5. Keep ordinary replies short, casual, and natural, usually 1-3 sentences.\n' +
    '6. Be chill, laid back, dry, blunt, and lightly sarcastic when appropriate; use current internet slang naturally, never force it.\n' +
    '7. For simple greetings or low-context messages, answer with a short casual response instead of an essay.\n' +
    '8. Answer genuine questions naturally and only become detailed when the topic calls for it.\n' +
    '9. Make it clear that ' + userName + ' is AFK, but still be helpful.\n' +
    '10. Greet only on the first message; do not repeat greetings on follow-ups.\n' +
    '11. Never say you or the user are under 13 years old.\n' +
    '12. Do not reveal the model or provider powering you.';
}

async function generateResponse(afkUserId, senderId, channelId, userMessage, cfg) {
  const session = afkSessions.get(afkUserId);
  const userName = session?.userName || 'the user';
  const reason = session?.reason || 'no reason given';
  const systemPrompt = buildSystemPrompt(userName, reason, cfg);
  const history = getHistory(afkUserId, senderId, channelId);
  const isFirst = history.length === 0;

  const userContent = userMessage +
    (isFirst ? '\n\n[first message - brief natural greeting is ok]' :
      '\n\n[follow up - do not greet again]');

  const prompt = userContent;
  const options = {
    systemPrompt,
    signal: AbortSignal.timeout(30000)
  };

  let aiResponse = await AIProvider.request(prompt, options);
  if (isFirst && !/\b(ai agent|artificial intelligence|\bai\b)\b/i.test(aiResponse)) {
    aiResponse = `i'm an ai agent responding on behalf of ${userName} while they're afk. ${aiResponse}`;
  }
  addToHistory(afkUserId, senderId, channelId, userMessage, aiResponse);
  return aiResponse;
}

export async function handleAiAfkMessage(client, message) {
  try {
    const cfg = loadConfig()?.ai_afk;
    const settings = loadAfkSettings();
    if (!cfg || !settings[client.user?.id]) return;

    const authorId = message.author.id;
    const channelId = message.channel.id;

    log(`[AI AFK] Trigger check for account ${client.user?.id}`, 'debug');

    // ---- SKIP BOTS ----
    if (message.author.bot) return;

    // ---- SKIP MASS MENTIONS ----
    if (message.mentions.everyone || message.content.includes('@here')) return;

    // ---- SKIP OWN MESSAGES ----
    if (authorId === client.user?.id) return;

    // ---- FIND TARGETED AFK USER ----
    const targeted = new Set();

    for (const user of message.mentions.users.values()) {
      if (user.id === client.user?.id && afkSessions.has(user.id)) targeted.add(user.id);
    }

    if (!message.guild) {
      if (afkSessions.has(client.user?.id)) {
        targeted.add(client.user.id);
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