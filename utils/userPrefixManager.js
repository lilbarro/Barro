import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PREFIX_FILE = path.join(__dirname, '..', 'data', 'userPrefixes.json');

let prefixes;

function loadPrefixes() {
    if (prefixes) return prefixes;

    try {
        prefixes = JSON.parse(fs.readFileSync(PREFIX_FILE, 'utf8'));
    } catch {
        prefixes = {};
    }

    return prefixes;
}

function savePrefixes() {
    fs.writeFileSync(PREFIX_FILE, JSON.stringify(prefixes, null, 2));
}

export function getUserPrefix(accountId, fallback) {
    const stored = loadPrefixes()[accountId];
    if (typeof stored === 'string') return stored;
    if (stored && typeof stored === 'object') return stored[accountId] || fallback;
    return fallback;
}

export function setUserPrefix(accountId, prefix) {
    const loaded = loadPrefixes();
    loaded[accountId] = prefix;
    savePrefixes();
}
