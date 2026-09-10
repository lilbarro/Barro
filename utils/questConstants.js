/**
 * Quest-related constants for mimicking a Discord client.
 */

import { randomUUID } from 'node:crypto';

export const QuestConstants = {
	USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9236 Chrome/138.0.7204.251 Safari/537.36',
	Properties: {
		os: 'Windows',
		browser: 'Discord Client',
		release_channel: 'stable',
		client_version: '1.0.9236',
		os_version: '10.0.19045',
		os_arch: 'x64',
		app_arch: 'x64',
		system_locale: 'en-US',
		has_client_mods: false,
		client_launch_id: randomUUID(),
		browser_user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9236 Chrome/138.0.7204.251 Safari/537.36',
		browser_version: '37.6.0',
		os_sdk_version: '19045',
		client_build_number: 539951,
		native_build_number: 81687,
		client_event_source: null,
		launch_signature: randomUUID(),
		client_heartbeat_session_id: randomUUID(),
		client_app_state: 'focused',
	},
	ANDROID_USER_AGENT: 'Discord-Android/316011;RNA',
	ANDROID_Properties: {
		os: 'Android',
		browser: 'Discord Android',
		device: 'b0q',
		system_locale: 'en-US',
		has_client_mods: false,
		client_version: '316.11 - rn',
		release_channel: 'googleRelease',
		device_vendor_id: randomUUID(),
		design_id: 2,
		browser_user_agent: '',
		browser_version: '',
		os_version: '28',
		client_build_number: 5169,
		client_event_source: null,
		client_launch_id: randomUUID(),
		launch_signature: '1771754995045142953',
		client_app_state: 'active',
		client_heartbeat_session_id: randomUUID(),
	},
};
