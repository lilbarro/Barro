import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const THEME_PATH = path.join(__dirname, '..', 'data', 'theme.json');

export const DEFAULT_THEME = Object.freeze({
	ACCENT_COLOR: '34',
	HEADER_COLOR: '4;30',
	HEADER_BOLD_COLOR: '30;1;4',
	LABEL_COLOR: '37',
	DIVIDER_COLOR: '0;30',
	TEXT_COLOR: '37'
});

export const THEME = { ...DEFAULT_THEME };
let savedThemes = {};
let legacyTheme = { ...DEFAULT_THEME };

function isValidColor(value) {
	if (typeof value !== 'string' || !/^(?:\d{1,3})(?:;\d{1,3})*$/.test(value) || value.length > 30) return false;
	const allowed = new Set(['0', '1', '4', '30', '31', '32', '33', '34', '35', '36', '37', '97']);
	return value.split(';').every(code => allowed.has(code));
}

function loadTheme() {
	try {
		if (!fs.existsSync(THEME_PATH)) return;
		const saved = JSON.parse(fs.readFileSync(THEME_PATH, 'utf8'));
		savedThemes = saved?.accounts && typeof saved.accounts === 'object' ? saved.accounts : {};
		const storedDefaults = saved?.defaults || saved;
		for (const key of Object.keys(DEFAULT_THEME)) {
			if (isValidColor(storedDefaults?.[key])) legacyTheme[key] = storedDefaults[key];
		}
	} catch {}
}

function saveTheme() {
	try {
		fs.writeFileSync(THEME_PATH, JSON.stringify({ defaults: legacyTheme, accounts: savedThemes }, null, 2));
	} catch (error) {
		throw new Error(`Could not save theme: ${error.message}`);
	}
}

function getAccountTheme(accountId) {
	return { ...legacyTheme, ...(savedThemes[accountId] || {}) };
}

export function activateTheme(accountId) {
	const accountTheme = getAccountTheme(accountId);
	for (const key of Object.keys(DEFAULT_THEME)) THEME[key] = accountTheme[key];
	return THEME;
}

export function setThemeColor(accountId, property, value) {
	if (!(property in DEFAULT_THEME)) throw new Error('Unknown theme color.');
	if (!isValidColor(value)) throw new Error('Use ANSI numbers like 34 or 1;33.');
	if (!accountId) throw new Error('Account ID is required.');
	if (!savedThemes[accountId]) savedThemes[accountId] = getAccountTheme(accountId);
	savedThemes[accountId][property] = value;
	THEME[property] = value;
	saveTheme();
	return value;
}

export function resetThemeColor(accountId, property) {
	if (!(property in DEFAULT_THEME)) throw new Error('Unknown theme color.');
	if (!accountId) throw new Error('Account ID is required.');
	if (!savedThemes[accountId]) savedThemes[accountId] = getAccountTheme(accountId);
	savedThemes[accountId][property] = DEFAULT_THEME[property];
	THEME[property] = DEFAULT_THEME[property];
	saveTheme();
	return THEME[property];
}

loadTheme();
