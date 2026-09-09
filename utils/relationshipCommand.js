import { formatAnsiBlocks, formatHeaderTitle, style } from './functions.js';
import { THEME } from './theme.js';

const TYPES = {
  friends: ['FRIEND'],
  blocked: ['BLOCKED'],
  ignored: ['IGNORED', 'IGNORE'],
  incoming: ['INCOMING_REQUEST'],
  outgoing: ['OUTGOING_REQUEST']
};

export async function executeRelationshipList(client, message, args, view, title) {
  const prefix = client.prefix;
  const first = args[0]?.toLowerCase();

  if (['help', '--help', '-h'].includes(first)) {
    return message.channel.send(formatRelationshipHelp(prefix));
  }

  const page = Math.max(1, parseInt(first || '1', 10) || 1);
  if (!client.relationships?.cache) {
    return message.channel.send(formatAnsiBlocks([
      [formatHeaderTitle('Barro Relationships')],
      [style('ERROR: ', THEME.LABEL_COLOR) + style('Relationship cache unavailable.', THEME.ACCENT_COLOR)],
      [style('Info: ', THEME.LABEL_COLOR) + style('Try again after login completes.', THEME.ACCENT_COLOR)]
    ]));
  }

  const relationships = [...client.relationships.cache.values()]
    .filter(relationship => TYPES[view].includes(String(relationship.type).toUpperCase()))
    .sort((left, right) => getDisplayName(left, client).localeCompare(getDisplayName(right, client)));
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(relationships.length / pageSize));

  if (page > totalPages) {
    return message.channel.send(formatAnsiBlocks([
      [formatHeaderTitle(`Barro ${title}`)],
      [style('ERROR: ', THEME.LABEL_COLOR) + style(`Page ${page} not found.`, THEME.ACCENT_COLOR)],
      [style('Pages: ', THEME.LABEL_COLOR) + style(`1-${totalPages}`, THEME.ACCENT_COLOR)]
    ]));
  }

  const start = (page - 1) * pageSize;
  const pageItems = relationships.slice(start, start + pageSize);
  const rows = pageItems.length
    ? pageItems.map((relationship, index) => {
        const user = getUser(relationship, client);
        return style(`${start + index + 1}.`, THEME.LABEL_COLOR) +
          style(` ${getDisplayName(relationship, client)}`, THEME.ACCENT_COLOR) +
          style(` | ${user?.id || relationship.id || 'unknown'}`, THEME.DIVIDER_COLOR);
      })
    : [style('No users found.', THEME.ACCENT_COLOR)];

  return message.channel.send(formatAnsiBlocks([
    [formatHeaderTitle(`${title} (Page ${page}/${totalPages})`)],
    [style('Users', THEME.HEADER_BOLD_COLOR), ...rows],
    [
      style('Navigation', THEME.HEADER_BOLD_COLOR),
      style(`${prefix}${commandFor(view)} ${Math.max(1, page - 1)}`, THEME.LABEL_COLOR) + style(' | Previous', THEME.ACCENT_COLOR),
      style(`${prefix}${commandFor(view)} ${Math.min(totalPages, page + 1)}`, THEME.LABEL_COLOR) + style(' | Next', THEME.ACCENT_COLOR),
      style('Total: ', THEME.LABEL_COLOR) + style(String(relationships.length), THEME.ACCENT_COLOR)
    ]
  ]));
}

export function formatRelationshipHelp(prefix) {
  return formatAnsiBlocks([
    [formatHeaderTitle('Barro Relationships')],
    [
      style('Commands', THEME.HEADER_BOLD_COLOR),
      style(`${prefix}friendlist [page]`, THEME.LABEL_COLOR) + style(' | Friends', THEME.ACCENT_COLOR),
      style(`${prefix}blocklist [page]`, THEME.LABEL_COLOR) + style(' | Blocked users', THEME.ACCENT_COLOR),
      style(`${prefix}ignoredlist [page]`, THEME.LABEL_COLOR) + style(' | Ignored users', THEME.ACCENT_COLOR),
      style(`${prefix}upcomingreq [page]`, THEME.LABEL_COLOR) + style(' | Incoming requests', THEME.ACCENT_COLOR),
      style(`${prefix}outgoingreq [page]`, THEME.LABEL_COLOR) + style(' | Outgoing requests', THEME.ACCENT_COLOR)
    ],
    [style('Pages', THEME.HEADER_BOLD_COLOR), style('Add a page number.', THEME.LABEL_COLOR)]
  ]);
}

function commandFor(view) {
  return {
    friends: 'friendlist',
    blocked: 'blocklist',
    ignored: 'ignoredlist',
    incoming: 'upcomingreq',
    outgoing: 'outgoingreq'
  }[view];
}

function getUser(relationship, client) {
  return relationship.user || client.users?.cache?.get(relationship.id) || client.users?.cache?.get(relationship.userId);
}

function getDisplayName(relationship, client) {
  const user = getUser(relationship, client);
  return user?.tag || user?.username || relationship.username || relationship.id || 'Unknown';
}