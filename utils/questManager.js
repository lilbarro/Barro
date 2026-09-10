import { QuestConstants } from './questConstants.js';
import { log } from './functions.js';

export class QuestManager {
	constructor(token) {
		this.token = token;
		this.quests = new Map();
		this.activeTasks = new Set();
		this.stopRequested = false;
	}

	// Helper for random delays to mimic human behavior
	async #randomSleep(min = 1000, max = 3000) {
		const ms = Math.floor(Math.random() * (max - min + 1) + min);
		return new Promise(r => setTimeout(r, ms));
	}

	async request(endpoint, options = {}) {
		log(`[API REQUEST] ${endpoint}`, 'debug');
		const url = `https://discord.com/api/v9${endpoint}`;

		// Ensure headers are initialized
		const headers = this.makeHeaders(options.headers || {});

		try {
			const response = await fetch(url, {
				...options,
				headers: {
					...Object.fromEntries(headers.entries()),
					'Content-Type': 'application/json',
				},
			});

			if (response.status === 429) {
				const errorData = await response.json().catch(() => ({}));
				const retryAfter = (errorData.retry_after || 5) * 1000;

				// If the rate limit is too long (e.g., > 30s), don't sleep and block the thread.
				// Throw a specific error so the caller (like a parallel batch) can skip this quest.
				if (retryAfter > 30000) {
					log(`Severe rate limit on ${endpoint} (${retryAfter}ms). Skipping to avoid blocking.`, 'warn');
					throw new Error(`RATE_LIMIT_TOO_LONG: ${retryAfter}`);
				}

				log(`Rate limited on ${endpoint}. Sleeping for ${retryAfter}ms...`, 'warn');
				await new Promise(r => setTimeout(r, retryAfter));
				return this.request(endpoint, options); // Retry after sleep
			}

			if (!response.ok) {
				const errorText = await response.text();
				let errorMessage = response.statusText;
				try {
					const errorData = JSON.parse(errorText);
					errorMessage = errorData.message || errorText;
				} catch {
					errorMessage = errorText || response.statusText;
				}
				throw new Error(`Discord API Error ${response.status}: ${errorMessage}`);
			}

			return response.json();
		} catch (err) {
			throw err;
		}
	}

	makeHeaders(customHeaders = {}) {
		const headers = new Headers();

		// Set the Authorization header - User tokens usually do NOT use 'Bearer ' prefix
		const auth = this.token ? this.token : '';
		headers.set('Authorization', auth);

		// Merge in custom headers (like 'AndroidRequest')
		if (customHeaders) {
			for (const [key, value] of Object.entries(customHeaders)) {
				headers.set(key, value);
			}
		}

		headers.set('accept-language', 'en-US');
		headers.set('x-debug-options', 'bugReporterEnabled');
		headers.set('x-discord-locale', 'en-US');
		headers.set('x-discord-timezone', 'Asia/Saigon');

		const isAndroid = headers.get('AndroidRequest') === 'true';

		if (isAndroid) {
			headers.set('User-Agent', QuestConstants.ANDROID_USER_AGENT);
			headers.set('x-super-properties', Buffer.from(JSON.stringify(QuestConstants.ANDROID_Properties)).toString('base64'));
		} else {
			headers.set('User-Agent', QuestConstants.USER_AGENT);
			headers.set('origin', 'https://discord.com');
			headers.set('referer', 'https://discord.com/channels/@me');
			headers.set('pragma', 'no-cache');
			headers.set('priority', 'u=1, i');
			headers.set('sec-ch-ua', '"Not)A;Brand";v="8", "Chromium";v="138"');
			headers.set('sec-ch-ua-mobile', '?0');
			headers.set('sec-ch-ua-platform', '"Windows"');
			headers.set('sec-fetch-dest', 'empty');
			headers.set('sec-fetch-mode', 'cors');
			headers.set('sec-fetch-site', 'same-origin');
			headers.set('x-super-properties', Buffer.from(JSON.stringify(QuestConstants.Properties)).toString('base64'));
		}

		return headers;
	}

	isQuestExpired(quest) {
		if (!quest?.config?.expires_at) return false;
		const expiryDate = new Date(quest.config.expires_at);
		return expiryDate < new Date();
	}

	async fetchQuests() {
		log(`!!! STARTING QUEST FETCH !!!`, 'info');
		try {
			const response = await this.request('/quests/@me');

			if (!response || typeof response !== 'object') {
				log(`!!! INVALID RESPONSE !!!: ${JSON.stringify(response)}`, 'error');
				return [];
			}

			const questList = response.quests || [];
			if (questList.length === 0) {
				log(`!!! NO QUESTS FOUND BY DISCORD !!! Raw response: ${JSON.stringify(response)}`, 'warn');
			} else {
				log(`!!! FOUND ${questList.length} QUESTS !!!`, 'info');
			}

			this.quests.clear();
			questList.forEach(q => this.quests.set(q.id, q));

			return Array.from(this.quests.values());
		} catch (error) {
			log(`!!! FETCH ERROR !!!: ${error.message}`, 'error');
			throw error;
		}
	}

	async acceptQuest(questId, isAndroid = false) {
		try {
			return await this.request(`/quests/${questId}/enroll`, {
				method: 'POST',
				headers: { 'AndroidRequest': isAndroid ? 'true' : 'false' },
				body: JSON.stringify({
					location: isAndroid ? 12 : 11,
					is_targeted: false,
					metadata_sealed: null,
					traffic_metadata_raw: this.quests.get(questId)?.raw?.traffic_metadata_raw || null,
					traffic_metadata_sealed: this.quests.get(questId)?.raw?.traffic_metadata_sealed || null,
				}),
			});
		} catch (error) {
			log(`Enrollment failed for quest ${questId}: ${error.message}. Continuing anyway...`, 'warn');
			return null;
		}
	}

	async redeemQuest(questId) {
		const quest = this.quests.get(questId);
		if (!quest) throw new Error('Quest not found in manager. Run /quest list first.');

		return this.request(`/quests/${questId}/claim-reward`, {
			method: 'POST',
			body: JSON.stringify({
				platform: quest.raw?.config?.rewards_config?.platforms[0] || 0,
				location: 11,
				is_targeted: false,
				metadata_raw: null,
				metadata_sealed: null,
				traffic_metadata_raw: quest.raw?.traffic_metadata_raw || null,
				traffic_metadata_sealed: quest.raw?.traffic_metadata_sealed || null,
			}),
		});
	}

	async doQuest(questId) {
		const quest = this.quests.get(questId);
		if (!quest) {
			log(`Quest ${questId} not found in cache. Attempting to refetch...`, 'warn');
			try {
				await this.fetchQuests();
				const refetchedQuest = this.quests.get(questId);
				if (!refetchedQuest) {
					throw new Error(`Quest ${questId} not found even after refetching. It may have expired or been removed.`);
				}
			} catch (refetchError) {
				throw new Error(`Quest ${questId} not found and refetch failed: ${refetchError.message}`);
			}
		}

		if (this.activeTasks.has(questId)) {
			log(`Quest ${questId} is already being processed.`, 'debug');
			return;
		}

		const currentQuest = this.quests.get(questId);

		// Enhanced check for completed/expired status
		const isCompleted = currentQuest?.user_status?.completed_at || currentQuest?.user_status?.claimed_at;
		const isExpired = this.isQuestExpired(currentQuest);

		if (isCompleted || isExpired) {
			log(`Skipping quest ${questId}: ${isCompleted ? 'Completed' : 'Expired'}`, 'debug');
			return;
		}

		this.activeTasks.add(questId);

		try {
			const questName = currentQuest.config?.messages?.quest_name || 'Unknown Quest';
			const taskConfig = currentQuest.config?.task_config_v2;
			if (!taskConfig) throw new Error('Quest has no task configuration.');

			const tasks = taskConfig.tasks;
			const taskName = ['WATCH_VIDEO', 'PLAY_ON_DESKTOP', 'PLAY_ON_XBOX', 'PLAY_ON_PLAYSTATION', 'STREAM_ON_DESKTOP', 'PLAY_ACTIVITY', 'WATCH_VIDEO_ON_MOBILE', 'ACHIEVEMENT_IN_ACTIVITY'].find(t => tasks[t] != null);

			if (!taskName) throw new Error('Unknown quest type.');

			const secondsNeeded = tasks[taskName].target;

			if (!currentQuest.user_status?.enrolled_at) {
				log(`Enrolling in quest "${questName}"...`, 'info');
				await this.acceptQuest(questId);
				await this.#randomSleep(2000, 4000);
			}

			switch (taskName) {
				case 'WATCH_VIDEO':
				case 'WATCH_VIDEO_ON_MOBILE':
					await this.doWatchVideo(questId, questName, secondsNeeded);
					break;
				case 'PLAY_ON_XBOX':
				case 'PLAY_ON_PLAYSTATION':
				case 'PLAY_ON_DESKTOP':
					await this.doPlayPlatform(questId, questName, secondsNeeded, taskName);
					break;
				case 'PLAY_ACTIVITY':
					await this.doPlayActivity(questId, questName, secondsNeeded, taskName);
					break;
				default:
					throw new Error(`Quest type ${taskName} is not currently supported for auto-completion.`);
			}
		} finally {
			this.activeTasks.delete(questId);
		}
	}

	async doWatchVideo(questId, questName, secondsNeeded) {
		log(`Spoofing video for ${questName}...`, 'info');
		let secondsDone = 0;
		let lastProgress = 0;

		while (secondsDone < secondsNeeded) {
			if (this.stopRequested) return;

			try {
				secondsDone += 14;
				await this.request(`/quests/${questId}/video-progress`, {
					method: 'POST',
					body: JSON.stringify({
						timestamp: Math.min(secondsNeeded, secondsDone + Math.random()),
					}),
				});

				// Periodically check actual progress to avoid phantom loops
				if (secondsDone % 28 === 0) {
					log(`Checking actual progress for ${questName}...`, 'debug');
					const status = await this.request('/quests/@me');
					const q = status.quests?.find(x => x.id === questId);
					const currentProgress = q?.user_status?.progress?.WATCH_VIDEO?.value || 0;

					log(`Actual progress for ${questName}: ${currentProgress}/${secondsNeeded}`, 'debug');

					if (currentProgress > lastProgress) {
						lastProgress = currentProgress;
					}
				}

			} catch (e) {
				if (e.message.includes('404') || e.message.includes('expired')) {
					log(`Quest "${questName}" has expired or is no longer available. Skipping...`, 'warn');
					return;
				}
				log(`Retry video progress for ${questName}: ${e.message}`, 'debug');
				await this.#randomSleep(5000, 10000);
				secondsDone -= 14;
				continue;
			}
			await this.#randomSleep(1000, 2000);
		}
		log(`Quest "${questName}" completed!`, 'success');
	}

	async doPlayPlatform(questId, questName, secondsNeeded, taskName) {
		log(`Spoofing game for ${questName}...`, 'info');
		const quest = this.quests.get(questId);
		const appId = quest.config?.application?.id;
		let lastProgress = 0;

		while (true) {
			if (this.stopRequested) return;

			try {
				const res = await this.request(`/quests/${questId}/heartbeat`, {
					method: 'POST',
					body: JSON.stringify({
						application_id: appId,
						terminal: false,
					}),
				});

				const status = res.user_status;
				if (status?.completed_at || status?.claimed_at) {
					log(`Quest ${questName} already completed!`, 'success');
					break;
				}

				const progress = status?.progress?.[taskName]?.value || 0;
				if (progress >= secondsNeeded) {
					// Finalize the quest with a terminal heartbeat to prevent 99% stuckness
					log(`Finalizing game quest ${questName}...`, 'debug');
					await this.request(`/quests/${questId}/heartbeat`, {
						method: 'POST',
						body: JSON.stringify({
							application_id: appId,
							terminal: true,
						}),
					});
					break;
				}

				if (progress > lastProgress) {
					lastProgress = progress;
				}

				log(`Progress: ${progress}/${secondsNeeded} seconds. Waiting...`, 'debug');
				await this.#randomSleep(28000, 32000);
			} catch (e) {
				if (e.message.includes('404') || e.message.includes('expired')) {
					log(`Quest "${questName}" has expired or is no longer available. Skipping...`, 'warn');
					return;
				}
				log(`Retry heartbeat for ${questName}: ${e.message}`, 'debug');
				await this.#randomSleep(10000, 20000);
			}
		}
		log(`Quest "${questName}" completed!`, 'success');
	}

	async doPlayActivity(questId, questName, secondsNeeded, taskName) {
		log(`Spoofing activity for ${questName}...`, 'info');
		const quest = this.quests.get(questId);
		const streamKey = 'call:1:1';
		let lastProgress = 0;

		while (true) {
			if (this.stopRequested) return;

			try {
				const res = await this.request(`/quests/${questId}/heartbeat`, {
					method: 'POST',
					body: JSON.stringify({
						stream_key: streamKey,
						terminal: false,
					}),
				});

				const status = res.user_status;
				if (status?.completed_at || status?.claimed_at) {
					log(`Quest ${questName} already completed!`, 'success');
					break;
				}

				const progress = status?.progress?.[taskName]?.value || 0;
				if (progress >= secondsNeeded) {
					// Finalize the quest with a terminal heartbeat to prevent 99% stuckness
					log(`Finalizing activity quest ${questName}...`, 'debug');
					await this.request(`/quests/${questId}/heartbeat`, {
						method: 'POST',
						body: JSON.stringify({
							stream_key: streamKey,
							terminal: true,
						}),
					});
					break;
				}

				if (progress > lastProgress) {
					lastProgress = progress;
				}

				log(`Progress: ${progress}/${secondsNeeded} seconds. Waiting...`, 'debug');
				await this.#randomSleep(28000, 32000);
			} catch (e) {
				if (e.message.includes('404') || e.message.includes('expired')) {
					log(`Quest "${questName}" has expired or is no longer available. Skipping...`, 'warn');
					return;
				}
				log(`Retry heartbeat for ${questName}: ${e.message}`, 'debug');
				await this.#randomSleep(10000, 20000);
			}
		}
		log(`Quest "${questName}" completed!`, 'success');
	}
}
