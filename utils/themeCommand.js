import { formatAnsiBlocks, formatHeaderTitle, style } from './functions.js';
import { THEME, DEFAULT_THEME, activateTheme, resetThemeColor, setThemeColor } from './theme.js';
import { ANSI_COLORS, resolveThemeColor, displayAnsiColor } from './themeColors.js';

export function createThemeCommand({ name, description, property, label }) {
  return {
    name,
    description,
    aliases: [],
    usage: 'set <color> | reset | status',
    category: 'theme',
    type: 'both',
    permissions: [],
    cooldown: 2,
    ownerOnly: true,

    async execute(client, message, args) {
      const accountId = client.user.id;
      activateTheme(accountId);
      const subcommand = args[0]?.toLowerCase();
      const prefix = client.prefix;

      if (!subcommand || ['help', '--help', '-h'].includes(subcommand)) {
        return message.channel.send(formatAnsiBlocks([
          [formatHeaderTitle(`Barro ${label} Color`)],
          [
            style('Usage', THEME.HEADER_BOLD_COLOR),
            ...formatRows([
              ['Set', `${prefix}${name} set <color>`],
              ['Status', `${prefix}${name} status`],
              ['Reset', `${prefix}${name} reset`]
            ])
          ],
          [
            style('Colors', THEME.HEADER_BOLD_COLOR),
            ...formatRows(Object.entries(ANSI_COLORS))
          ],
          [style('Current', THEME.HEADER_BOLD_COLOR), ...formatRows([[label, displayAnsiColor(THEME[property], property)]])]
        ]));
      }

      if (subcommand === 'status') {
        return message.channel.send(formatAnsiBlocks([
          [formatHeaderTitle(`Barro ${label} Color`)],
          [style('Current', THEME.HEADER_BOLD_COLOR), ...formatRows([[label, displayAnsiColor(THEME[property], property)]])]
        ]));
      }

      if (subcommand === 'reset') {
        const value = resetThemeColor(accountId, property);
        return message.channel.send(formatAnsiBlocks([
          [formatHeaderTitle(`Barro ${label} Color`)],
          [style('Status', THEME.HEADER_BOLD_COLOR), style('Reset: ', THEME.LABEL_COLOR) + style(value, THEME.ACCENT_COLOR)]
        ]));
      }

      if (subcommand !== 'set') {
        return message.channel.send(formatAnsiBlocks([
          [formatHeaderTitle(`Barro ${label} Color`)],
          [style('ERROR', THEME.HEADER_BOLD_COLOR), style('Use the set subcommand.', THEME.ACCENT_COLOR)],
          [style('Example: ', THEME.LABEL_COLOR) + style(`${prefix}${name} set cyan`, THEME.ACCENT_COLOR)]
        ]));
      }

      try {
        const value = setThemeColor(accountId, property, resolveThemeColor(args[1], property));
        return message.channel.send(formatAnsiBlocks([
          [formatHeaderTitle(`Barro ${label} Color`)],
          [style('Status', THEME.HEADER_BOLD_COLOR), style('Updated: ', THEME.LABEL_COLOR) + style(value, THEME.ACCENT_COLOR)],
          [style('Info: ', THEME.LABEL_COLOR) + style('Applies immediately.', THEME.ACCENT_COLOR)]
        ]));
      } catch (error) {
        return message.channel.send(formatAnsiBlocks([
          [formatHeaderTitle(`Barro ${label} Color`)],
          [style('ERROR', THEME.HEADER_BOLD_COLOR), style(error.message, THEME.ACCENT_COLOR)],
          [style('Example: ', THEME.LABEL_COLOR) + style(`${prefix}${name} set cyan`, THEME.ACCENT_COLOR)]
        ]));
      }
    }
  };
}

export function getThemeDefault(property) {
  return DEFAULT_THEME[property];
}

function formatRows(rows) {
  const width = Math.max(...rows.map(([label]) => String(label).length));
  return rows.map(([label, value]) =>
    style(String(label).padEnd(width, ' '), THEME.LABEL_COLOR) +
    style(' | ', THEME.DIVIDER_COLOR) +
    style(String(value), THEME.ACCENT_COLOR)
  );
}
