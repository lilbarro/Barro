import fs from 'fs';
import path from 'path';
import { resolve } from 'path';
import { log } from './functions.js';
import TaskManager from './TaskManager.js';

const SHADOW_DIR = resolve('./data/shadow');
const TARGETS_PATH = path.join(SHADOW_DIR, 'targets.json');
const INVITES_PATH = path.join(SHADOW_DIR, 'invites.json');

class ShadowManager {
    constructor() {
        this.targets = new Map(); // userId -> { intensity, startTime, currentGuilds: [] }
        this.invites = new Map(); // userId -> Set of { invite, guildId, verified }
        this.loadData();
    }

    loadData() {
        try {
            if (!fs.existsSync(SHADOW_DIR)) {
                fs.mkdirSync(SHADOW_DIR, { recursive: true });
            }

            if (fs.existsSync(TARGETS_PATH)) {
                const data = JSON.parse(fs.readFileSync(TARGETS_PATH, 'utf-8'));
                for (const [userId, info] of Object.entries(data)) {
                    this.targets.set(userId, info);
                }
            }

            if (fs.existsSync(INVITES_PATH)) {
                const data = JSON.parse(fs.readFileSync(INVITES_PATH, 'utf-8'));
                for (const [userId, invites] of Object.entries(data)) {
                    this.invites.set(userId, new Set(invites));
                }
            }
        } catch (err) {
            log(`Error loading shadow data: ${err.message}`, 'error');
        }
    }

    saveData() {
        try {
            const targetsObj = {};
            for (const [userId, info] of this.targets.entries()) {
                targetsObj[userId] = info;
            }
            fs.writeFileSync(TARGETS_PATH, JSON.stringify(targetsObj, null, 2));

            const invitesObj = {};
            for (const [userId, invites] of this.invites.entries()) {
                invitesObj[userId] = Array.from(invites);
            }
            fs.writeFileSync(INVITES_PATH, JSON.stringify(invitesObj, null, 2));
        } catch (err) {
            log(`Error saving shadow data: ${err.message}`, 'error');
        }
    }

    startShadowing(userId, intensity = 'standard') {
        const targetInfo = {
            intensity,
            startTime: Date.now(),
            currentGuilds: []
        };
        this.targets.set(userId, targetInfo);
        this.saveData();

        // Create a TaskManager task for this target to track the session
        TaskManager.createTask('shadow', userId);

        log(`Started shadowing user ${userId} with ${intensity} intensity.`, 'debug');
        return true;
    }

    stopShadowing(userId) {
        if (!this.targets.has(userId)) return false;

        this.targets.delete(userId);
        this.saveData();
        TaskManager.destroyTask(`shadow:${userId}`);

        log(`Stopped shadowing user ${userId}.`, 'debug');
        return true;
    }

    getTarget(userId) {
        return this.targets.get(userId);
    }

    getAllTargets() {
        return this.targets;
    }

    /**
     * Mirror Voice State
     * Handles the logic of joining a voice channel after a target moves
     */
    async mirrorVoiceState(client, targetUserId, newState) {
        const target = this.getTarget(targetUserId);
        if (!target) return;

        // If target left voice, we leave too
        if (!newState.channelId) {
            const myState = client.guilds.cache.get(newState.guildId)?.members.cache.get(client.user.id);
            if (myState && myState.channelId) {
                // Use WebSocket opcode 4 to leave
                client.ws.shards.first().send({
                    op: 4,
                    d: {
                        guild_id: newState.guildId,
                        channel_id: null,
                        self_mute: false,
                        self_deaf: false,
                    }
                });
            }
            return;
        }

        // Target joined or moved to a channel
        const delay = this.getRandomDelay(target.intensity);

        // Create a timeout via TaskManager to execute the join after the random delay
        TaskManager.createTimeout(`shadow:${targetUserId}`, async () => {
            try {
                client.ws.shards.first().send({
                    op: 4,
                    d: {
                        guild_id: newState.guildId,
                        channel_id: newState.channelId,
                        self_mute: false,
                        self_deaf: false,
                    }
                });
                log(`Mirrored voice move for ${targetUserId} to ${newState.channel.name}`, 'debug');
            } catch (err) {
                log(`Error mirroring voice move for ${targetUserId}: ${err.message}`, 'error');
            }
        }, delay);
    }

    /**
     * Invite Discovery and Server Mirroring
     */
    async discoverAndJoin(client, targetUserId, inviteCode) {
        const target = this.getTarget(targetUserId);
        if (!target) return;

        try {
            const delay = this.getRandomDelay(target.intensity);

            TaskManager.createTimeout(`shadow:${targetUserId}`, async () => {
                try {
                    await client.join(inviteCode);
                    log(`Successfully shadowed target ${targetUserId} into server via invite ${inviteCode}`, 'success');

                    // Add to verified invites
                    if (!this.invites.has(targetUserId)) {
                        this.invites.set(targetUserId, new Set());
                    }
                    this.invites.get(targetUserId).add({
                        invite: inviteCode,
                        verified: true,
                        joinedAt: Date.now()
                    });
                    this.saveData();
                } catch (err) {
                    log(`Failed to join server via invite ${inviteCode}: ${err.message}`, 'error');
                }
            }, delay);

        } catch (err) {
            log(`Error in discovery process for ${targetUserId}: ${err.message}`, 'error');
        }
    }

    getRandomDelay(intensity) {
        const config = this.loadConfig();
        const range = config.shadow?.delays?.[intensity] || [120, 600];
        const [min, max] = range;
        return Math.floor(Math.random() * (max - min + 1) + min) * 1000;
    }

    loadConfig() {
        try {
            const content = fs.readFileSync(resolve('./config.yaml'), 'utf-8');
            const shadowSection = content.split('shadow:')[1]?.split('crypto:')[0] || '';
            const defaultIntensity = shadowSection.match(/default_intensity:\s*(\w+)/)?.[1] || 'standard';

            const delays = {};
            ['passive', 'standard', 'aggressive'].forEach(level => {
                const regex = new RegExp(`${level}:\\s*\\[([\\d,\\s]+)\\]`);
                const match = shadowSection.match(regex);
                if (match) {
                    delays[level] = match[1].split(',').map(v => parseInt(v.trim()));
                }
            });

            return {
                defaultIntensity,
                delays
            };
        } catch (err) {
            return { defaultIntensity: 'standard', delays: { standard: [120, 600] } };
        }
    }
}

export default new ShadowManager();
