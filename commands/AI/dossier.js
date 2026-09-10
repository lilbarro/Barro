import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, join } from 'path';
import { Permissions } from 'discord.js-selfbot-v13';
import { THEME } from "../../utils/theme.js";
import { formatHeaderTitle, formatAnsiBlocks } from "../../utils/functions.js";
import TaskManager from "../../utils/TaskManager.js";
import RateLimitManager from "../../utils/RateLimitManager.js";
import AIProvider from "../../utils/AIProvider.js";
import StalkManager from "../../utils/StalkManager.js";

const DOSSIER_RAW_DIR = resolve('./data/dossier/raw');
const DOSSIER_ANALYZED_DIR = resolve('./data/dossier/analyzed');
const DOSSIER_REPORTS_DIR = resolve('./data/dossier/reports');
const rateLimiter = new RateLimitManager(1);

// ============================================
// VISUAL FORMATTING HELPERS (ANSI THEME)
// ============================================

function style(text, colorCode, underlined = false) {
    const underline = underlined ? '\x1b[4m' : '';
    return `${underline}\x1b[${colorCode}m${text}\x1b[0m`;
}

function kv(label, value, padTo = 15) {
    const padded = String(label).padEnd(padTo, ' ');
    return style(padded, THEME.LABEL_COLOR) + style(' | ', THEME.DIVIDER_COLOR) + style(String(value), THEME.ACCENT_COLOR);
}

function sectionHeader(label) {
    return style(`  ${label.toUpperCase()}  `, '1;37;44', true);
}

function stageLine(label, tag) {
    return style(label, THEME.LABEL_COLOR) + style(' | ', THEME.DIVIDER_COLOR) + style(tag, tag === 'Done' ? '0;32' : THEME.ACCENT_COLOR);
}

function loadJSON(path) {
    try {
        if (!existsSync(path)) return {};
        return JSON.parse(readFileSync(path, 'utf-8'));
    } catch {
        return {};
    }
}

function saveJSON(path, data) {
    try {
        writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
        console.error(`Error saving JSON to ${path}: ${err.message}`);
    }
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

function renderDossierHelp(prefix) {
    const header = [
        formatHeaderTitle('Barro Dossier Intelligence')
    ];
    const description = [
        style('Description', THEME.HEADER_BOLD_COLOR, true),
        style('Build an organized profile from accessible mutual-server data.', THEME.ACCENT_COLOR),
        style('The scan may take a while when many readable channels are available.', THEME.LABEL_COLOR)
    ];
    const options = [
        style('Options', THEME.HEADER_BOLD_COLOR, true),
        kv('--summary', 'Show a condensed report'),
        kv('--deep', 'Include collected message records'),
        kv('--psych', 'Include communication analysis'),
        kv('--network', 'Include mutual-server and role data'),
        kv('--temporal', 'Include activity timeline data'),
        kv('--update', 'Refresh an existing profile'),
        kv('--export', 'Write a text report to data/dossier/reports')
    ];
    const usage = [
        style('Usage', THEME.HEADER_BOLD_COLOR, true),
        style(`${prefix}dossier @user`, THEME.ACCENT_COLOR),
        style(`${prefix}dossier @user --summary`, THEME.ACCENT_COLOR),
        style(`${prefix}dossier @user --deep --network --export`, THEME.ACCENT_COLOR),
        '',
        style('Aliases', THEME.HEADER_BOLD_COLOR, true),
        style(`${prefix}profile`, THEME.ACCENT_COLOR) + style('  ', THEME.DIVIDER_COLOR) + style(`${prefix}intel`, THEME.ACCENT_COLOR) + style('  ', THEME.DIVIDER_COLOR) + style(`${prefix}casefile`, THEME.ACCENT_COLOR)
    ];
    return formatAnsiBlocks([header, description, options, usage]);
}

/**
 * Parses stalk logs into a message format compatible with analyzeMessages
 * @param {string} userId
 * @returns {Array}
 */
async function parseStalkLogs(userId) {
    const logs = StalkManager.readStalkLog(userId);
    if (!logs) return [];

    const messages = [];
    const lines = logs.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.includes('MESSAGE_SENT') && !line.includes('MESSAGE_EDITED') && !line.includes('MESSAGE_DELETED')) continue;

        const timestampMatch = line.match(/^\[(.+?)\]/);
        if (!timestampMatch) continue;

        const timestamp = timestampMatch[1];
        let content = '';

        // Look ahead for Content: line
        for (let j = i + 1; j < lines.length && j < i + 5; j++) {
            if (lines[j].startsWith('  Content: ')) {
                content = lines[j].replace('  Content: ', '').trim();
                break;
            } else if (lines[j].startsWith('  New Content: ')) {
                content = lines[j].replace('  New Content: ', '').trim();
                break;
            }
        }

        messages.push({
            content: content || '[No content]',
            createdAt: new Date(timestamp),
            channelId: 'stalked-archive'
        });
    }

    return messages;
}

/**
 * Linguistic and Behavioral Analysis Engine
 */
async function analyzeMessages(messages, options = {}, signal) {
    const stats = {
        totalMessages: messages.length,
        frequency: {},
        vocabulary: {},
        sentiment: { positive: 0, negative: 0, neutral: 0 },
        topics: {},
        quirks: [],
        avgLength: 0,
        activityCycles: { daily: {}, weekly: {} }
    };

    const positiveWords = ['love', 'great', 'amazing', 'happy', 'good', 'excellent', 'awesome', 'best'];
    const negativeWords = ['hate', 'bad', 'worst', 'angry', 'sad', 'terrible', 'awful', 'stupid'];
    const topicKeywords = {
        'Programming': ['js', 'python', 'rust', 'code', 'api', 'github', 'dev', 'script', 'git'],
        'Gaming': ['game', 'play', 'xbox', 'ps5', 'steam', 'valorant', 'minecraft', 'roleplay'],
        'Social': ['lol', 'lmao', 'haha', 'hey', 'hello', 'hi', 'everyone'],
        'Emotional': ['feel', 'think', 'wonder', 'sad', 'happy', 'stressed', 'anxious']
    };

    let totalChars = 0;

    messages.forEach(msg => {
        const content = msg.content.toLowerCase();
        totalChars += content.length;

        const date = new Date(msg.createdAt);
        const hour = date.getHours();
        stats.frequency[hour] = (stats.frequency[hour] || 0) + 1;

        const day = date.toLocaleDateString('en-US', { weekday: 'long' });
        stats.activityCycles.weekly[day] = (stats.activityCycles.weekly[day] || 0) + 1;

        const words = content.split(/\s+/);
        words.forEach(word => {
            if (word.length > 3) {
                stats.vocabulary[word] = (stats.vocabulary[word] || 0) + 1;
            }
        });

        let pos = 0, neg = 0;
        positiveWords.forEach(pw => { if (content.includes(pw)) pos++; });
        negativeWords.forEach(nw => { if (content.includes(nw)) neg++; });

        if (pos > neg) stats.sentiment.positive++;
        else if (neg > pos) stats.sentiment.negative++;
        else stats.sentiment.neutral++;

        for (const [topic, keywords] of Object.entries(topicKeywords)) {
            keywords.forEach(kw => {
                if (content.includes(kw)) {
                    stats.topics[topic] = (stats.topics[topic] || 0) + 1;
                }
            });
        }
    });

    stats.avgLength = messages.length ? Math.round(totalChars / messages.length) : 0;
    const sortedVocab = Object.entries(stats.vocabulary)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word]) => word);
    stats.quirks = sortedVocab;

    try {
        const sampleMessages = messages.slice(-50).map(m => `[${m.createdAt}] ${m.content}`).join('\n');
        const aiPrompt = `Perform a deep psychological and behavioral profile on this user based on their message history.

        STATISTICS:
        - Total Messages: ${stats.totalMessages}
        - Avg Length: ${stats.avgLength}
        - Top Interests: ${JSON.stringify(stats.topics)}
        - Sentiment: ${JSON.stringify(stats.sentiment)}
        - Frequent Words: ${stats.quirks.join(', ')}

        MESSAGE SAMPLE:
        ${sampleMessages}

        Provide a concise analysis in the following JSON format:
        {
            "personality": "string (3-5 words describing personality)",
            "emotionalState": "string (current mood/trend)",
            "interests": "string (detailed hobbies/interests)",
            "communicationStyle": "string (direct, passive, aggressive, etc.)",
            "riskAssessment": "string (low/medium/high and why)"
        }`;

        const aiResult = await AIProvider.request(aiPrompt, {
            systemPrompt: 'You are an expert Digital Forensic Psychologist. Provide objective, sharp, and clinical analysis of online behavior.',
            signal
        });

        const jsonMatch = aiResult.match(/\{.*\}/s);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            stats.aiProfile = parsed;
        } else {
            stats.aiProfile = { personality: 'Analysis inconclusive', emotionalState: 'Unknown', interests: 'Unknown', communicationStyle: 'Unknown', riskAssessment: 'Unknown' };
        }
    } catch (err) {
        console.error('Dossier AI Error:', err.message);
        stats.aiProfile = { personality: 'AI analysis failed', emotionalState: 'Error', interests: 'Error', communicationStyle: 'Error', riskAssessment: 'Error' };
    }

    return stats;
}

/**
 * Network and Relationship Mapping
 */
async function mapNetwork(client, targetUser) {
    const network = {
        mutualServers: [],
        influenceScore: 0,
        circles: [],
        hierarchy: 'Unknown'
    };

    const guilds = client.guilds.cache.filter(g => g.members.cache.has(targetUser.id));

    guilds.forEach(guild => {
        const member = guild.members.cache.get(targetUser.id);
        if (!member) return;
        network.mutualServers.push({
            name: guild.name,
            roles: member.roles.cache.map(r => r.name),
            activity: 'Unknown'
        });

        if (member.permissions?.has(Permissions.FLAGS.ADMINISTRATOR)) {
            network.influenceScore += 50;
            network.hierarchy = 'High (Admin)';
        } else if (member.roles.cache.size > 5) {
            network.influenceScore += 10;
        }
    });

    return network;
}

export default {
    name: 'dossier',
    description: 'Create a user intelligence profile',
    aliases: ['profile', 'intel', 'casefile'],
    usage: '<@user> [options]',
    category: 'AI',
    type: 'both',
    permissions: ['SendMessages'],
    cooldown: 1,
    ownerOnly: false,

    async execute(client, message, args) {
        console.log(`[DEBUG] Dossier execute called by ${message.author.tag}`);
        if (!args[0] || ['help', '--help', '-h'].includes(args[0].toLowerCase())) {
            return message.channel.send(renderDossierHelp(client.prefix));
        }

        let target;
        try {
            const mentioned = message.mentions.users.first();
            if (mentioned) {
                target = mentioned;
            } else if (args[0]) {
                const userId = args[0].replace(/[<@!>]/g, '');
                target = await client.users.fetch(userId);
            }
        } catch (err) {
            console.error(`[Dossier] Target lookup failed: ${err.message}`);
            return message.channel.send('> ❌ Could not find that user!');
        }

        if (!target) {
            return message.channel.send('> ❌ Please specify a user mention or Discord user ID.');
        }

        const options = {
            deep: args.includes('--deep'),
            psych: args.includes('--psych'),
            network: args.includes('--network'),
            temporal: args.includes('--temporal'),
            summary: args.includes('--summary'),
            update: args.includes('--update'),
            export: args.includes('--export'),
        };

        const task = TaskManager.createTask('dossier', target.id);
        if (!task) return message.channel.send('> ❌ Analysis already in progress for this user!');

        let scanMsg;
        try {
            scanMsg = await message.channel.send(formatAnsiBlocks([
                [formatHeaderTitle('Barro Intelligence Agency')],
                [
                    style('Target', THEME.HEADER_BOLD_COLOR, true),
                    kv('Name', target.username),
                    kv('Id', target.id),
                    '',
                    style('Status', THEME.HEADER_BOLD_COLOR, true),
                    kv('Phase', 'Initializing'),
                    kv('Progress', '0%')
                ],
                [
                    style('Intelligence Stages', THEME.ACCENT_COLOR, true),
                    stageLine('1. Initializing Dossier Core', 'Active'),
                    style('>> Connecting to intelligence nodes...', THEME.LABEL_COLOR)
                ]
            ]));
        } catch (err) {
            task.stop();
            return message.channel.send(`> ❌ Error starting dossier: ${err.message}`);
        }

        try {
            await sleep(1500);
            await scanMsg.edit(formatAnsiBlocks([
                [formatHeaderTitle('Barro Intelligence Agency')],
                [
                    style('Target', THEME.HEADER_BOLD_COLOR, true),
                    kv('Name', target.username),
                    kv('Id', target.id),
                    '',
                    style('Status', THEME.HEADER_BOLD_COLOR, true),
                    kv('Phase', 'Collection'),
                    kv('Progress', '20%')
                ],
                [
                    style('Intelligence Stages', THEME.ACCENT_COLOR, true),
                    stageLine('1. Initializing Dossier Core', 'Done'),
                    stageLine('2. Aggregating Message History', 'Active'),
                    style('>> Scanning mutual channels...', THEME.LABEL_COLOR)
                ]
            ])).catch(() => {});

            const allMessages = [];
            const mutualGuilds = client.guilds.cache.filter(g => g.members.cache.has(target.id));
            const textChannels = [...new Map(
                [...mutualGuilds.values()].flatMap(guild =>
                    [...guild.channels.cache.values()]
                        .filter(channel => channel.isText() && channel.permissionsFor(client.user).has(Permissions.FLAGS.VIEW_CHANNEL))
                        .map(channel => [channel.id, channel])
                )
            ).values()];
            let scannedChannels = 0;

            for (const channel of textChannels) {
                if (task.signal.aborted) break;
                try {
                    const messages = await rateLimiter.execute(
                        () => channel.messages.fetch({ limit: 100 }),
                        task.signal
                    );
                    const targetMsgs = messages.filter(m => m.author.id === target.id).map(m => ({
                        content: m.content,
                        createdAt: m.createdAt,
                        channelId: channel.id
                    }));
                    allMessages.push(...targetMsgs);
                    scannedChannels++;
                    const progress = Math.min(100, Math.round((scannedChannels / Math.max(textChannels.length, 1)) * 100));
                    await scanMsg.edit(formatAnsiBlocks([
                        [formatHeaderTitle('Barro Intelligence Agency')],
                        [
                            style('Target', THEME.HEADER_BOLD_COLOR, true),
                            kv('Name', target.username),
                            kv('Id', target.id),
                            '',
                            style('Status', THEME.HEADER_BOLD_COLOR, true),
                            kv('Phase', 'Collection'),
                            kv('Progress', `${progress}%`)
                        ],
                        [
                            style('Intelligence Stages', THEME.ACCENT_COLOR, true),
                            stageLine('1. Initializing Dossier Core', 'Done'),
                            stageLine('2. Aggregating Message History', 'Active'),
                            style(`>> ${scannedChannels}/${textChannels.length} channels scanned | ${allMessages.length} messages found`, THEME.LABEL_COLOR)
                        ]
                    ])).catch(() => {});
                } catch (err) {
                    console.error(`[Dossier] Could not scan channel ${channel.id}: ${err.message}`);
                }
            }

            // Integration: Pull from StalkManager archives
            const archivedMsgs = await parseStalkLogs(target.id);
            if (archivedMsgs.length > 0) {
                allMessages.push(...archivedMsgs);
            }

            await sleep(1500);
            await scanMsg.edit(formatAnsiBlocks([
                [formatHeaderTitle('Barro Intelligence Agency')],
                [
                    style('Target', THEME.HEADER_BOLD_COLOR, true),
                    kv('Name', target.username),
                    kv('Id', target.id),
                    '',
                    style('Status', THEME.HEADER_BOLD_COLOR, true),
                    kv('Phase', 'Analysis'),
                    kv('Progress', '50%')
                ],
                [
                    style('Intelligence Stages', THEME.ACCENT_COLOR, true),
                    stageLine('1. Initializing Dossier Core', 'Done'),
                    stageLine('2. Aggregating Message History', 'Done'),
                    stageLine('3. Running Behavioral Analysis', 'Active'),
                    style('>> Processing linguistic patterns...', THEME.LABEL_COLOR)
                ]
            ])).catch(() => {});

            const analysis = await analyzeMessages(allMessages, options, task.signal);

            await sleep(1500);
            await scanMsg.edit(formatAnsiBlocks([
                [formatHeaderTitle('Barro Intelligence Agency')],
                [
                    style('Target', THEME.HEADER_BOLD_COLOR, true),
                    kv('Name', target.username),
                    kv('Id', target.id),
                    '',
                    style('Status', THEME.HEADER_BOLD_COLOR, true),
                    kv('Phase', 'Mapping'),
                    kv('Progress', '80%')
                ],
                [
                    style('Intelligence Stages', THEME.ACCENT_COLOR, true),
                    stageLine('1. Initializing Dossier Core', 'Done'),
                    stageLine('2. Aggregating Message History', 'Done'),
                    stageLine('3. Running Behavioral Analysis', 'Done'),
                    stageLine('4. Mapping Relationship Network', 'Active'),
                    style('>> Analyzing social circles...', THEME.LABEL_COLOR)
                ]
            ])).catch(() => {});

            const network = await mapNetwork(client, target);

            await sleep(1500);
            await scanMsg.edit(formatAnsiBlocks([
                [formatHeaderTitle('Barro Intelligence Agency')],
                [
                    style('Target', THEME.HEADER_BOLD_COLOR, true),
                    kv('Name', target.username),
                    kv('Id', target.id),
                    '',
                    style('Status', THEME.HEADER_BOLD_COLOR, true),
                    kv('Phase', 'Compiling'),
                    kv('Progress', '100%')
                ],
                [
                    style('Intelligence Stages', THEME.ACCENT_COLOR, true),
                    stageLine('1. Initializing Dossier Core', 'Done'),
                    stageLine('2. Aggregating Message History', 'Done'),
                    stageLine('3. Running Behavioral Analysis', 'Done'),
                    stageLine('4. Mapping Relationship Network', 'Done'),
                    stageLine('5. Compiling Final Dossier', 'Done'),
                    style('>> Report ready.', THEME.LABEL_COLOR)
                ]
            ])).catch(() => {});

            const userData = {
                identity: {
                    username: target.username,
                    id: target.id,
                    createdAt: target.createdTimestamp,
                    updatedAt: Date.now()
                },
                analysis,
                network,
                rawMessages: options.deep ? allMessages : []
            };

            const userRawPath = join(DOSSIER_RAW_DIR, target.id, 'messages.json');
            const userAnalyzedPath = join(DOSSIER_ANALYZED_DIR, target.id, 'profile.json');

            mkdirSync(join(DOSSIER_RAW_DIR, target.id), { recursive: true });
            mkdirSync(join(DOSSIER_ANALYZED_DIR, target.id), { recursive: true });

            saveJSON(userRawPath, allMessages);
            saveJSON(userAnalyzedPath, userData);

            const report = renderDossierReport(userData, options);
            await message.channel.send(report).catch(() => {});

            if (options.export) {
                const reportPath = join(DOSSIER_REPORTS_DIR, target.id, `report_${Date.now()}.txt`);
                mkdirSync(join(DOSSIER_REPORTS_DIR, target.id), { recursive: true });
                writeFileSync(reportPath, report, 'utf-8');
                await message.channel.send(`> 📁 Dossier exported to: \`${reportPath}\``);
            }

        } catch (err) {
            console.error('[Dossier] Analysis failed:', err);
            await scanMsg?.edit(formatAnsiBlocks([
                [formatHeaderTitle('Barro Intelligence Agency')],
                [
                    style('Status', THEME.HEADER_BOLD_COLOR, true),
                    kv('Phase', 'Failed'),
                    kv('Error', err.message)
                ]
            ])).catch(() => {});
            await message.channel.send(`> ❌ Dossier failed: ${err.message}`);
        } finally {
            task.stop();
        }
    }
};

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function renderDossierReport(data, options) {
    const { identity, analysis, network } = data;
    const blocks = [];

    blocks.push([formatHeaderTitle('Digital Intelligence Dossier')]);

    // Identity Block
    blocks.push([
        sectionHeader('Identity'),
        kv('Target', identity.username),
        kv('ID', identity.id),
        kv('Created', formatDate(identity.createdAt)),
        kv('Source', analysis.totalMessages > 100 ? 'Archived Intelligence' : 'Live Scan', 10)
    ]);

    if (!options.summary) {
        // Network Block
        blocks.push([
            sectionHeader('Network'),
            kv('Influence', network.influenceScore + ' pts'),
            kv('Hierarchy', network.hierarchy),
            kv('Mutual Servers', network.mutualServers.length),
            ...network.mutualServers.slice(0, 5).map(s => style(`- ${s.name} (${s.roles.join(', ') || 'No roles'})`, THEME.ACCENT_COLOR))
        ]);

        // Behavioral Block
        blocks.push([
            sectionHeader('Behavioral'),
            kv('Msg Count', analysis.totalMessages),
            kv('Avg Length', analysis.avgLength + ' chars'),
            (() => {
                const peakHour = Object.entries(analysis.frequency).sort((a, b) => b[1] - a[1])[0];
                return kv('Peak Activity', peakHour ? `${peakHour[0]}:00` : 'Unknown');
            })()
        ]);

        // Psychological Block
        blocks.push([
            sectionHeader('Psychological'),
            ...(() => {
                const ai = analysis.aiProfile || {};
                return [
                    kv('Personality', ai.personality || 'Unknown'),
                    kv('Mood', ai.emotionalState || 'Unknown'),
                    kv('Interests', ai.interests || 'Unknown'),
                    kv('Style', ai.communicationStyle || 'Unknown'),
                    kv('Common Quirks', analysis.quirks.slice(0, 3).join(', '))
                ];
            })()
        ]);
    }

    // Assessment Block
    blocks.push([
        sectionHeader('Final Assessment'),
        (() => {
            const score = (analysis.totalMessages * 0.1) + (network.influenceScore * 0.5);
            return [
                kv('Intel Score', score.toFixed(2)),
                kv('Risk Level', score > 100 ? 'High' : score > 50 ? 'Medium' : 'Low')
            ];
        })().flat(),
        '',
        style('WARNING: This data is aggregated for intelligence purposes only.', '1;31')
    ]);

    return formatAnsiBlocks(blocks);
}
