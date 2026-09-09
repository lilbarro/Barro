export const ANSI_COLORS = {
  black: '30',
  red: '31',
  green: '32',
  yellow: '33',
  blue: '34',
  magenta: '35',
  cyan: '36',
  white: '37',
  brightwhite: '97'
};

export function resolveAnsiColor(value) {
  const normalized = String(value || '').toLowerCase().replace(/[ _-]/g, '');
  return ANSI_COLORS[normalized] || value;
}

export function resolveThemeColor(value, property) {
  const resolved = resolveAnsiColor(value);
  if (resolved === value) return resolved;
  if (property === 'HEADER_COLOR') return `4;${resolved}`;
  if (property === 'HEADER_BOLD_COLOR') return `${resolved};1;4`;
  return resolved;
}

export function formatAnsiColorList() {
  return Object.entries(ANSI_COLORS).map(([name, code]) => `${name}=${code}`).join(' | ');
}

export function displayAnsiColor(value, property) {
  if (property === 'HEADER_COLOR' && value === '4;30') return 'underlined black (4;30)';
  if (property === 'HEADER_BOLD_COLOR' && value === '30;1;4') return 'bold underlined black (30;1;4)';
  const name = Object.entries(ANSI_COLORS).find(([, code]) => code === value)?.[0];
  return name ? `${name} (${value})` : value;
}
