import { log } from "../../utils/functions.js";
import axios from 'axios';
import { THEME } from "../../utils/theme.js";
import { formatHeaderTitle } from "../../utils/functions.js";

export default {
  name: 'iplookup',
  description: 'Look up IP details',
  aliases: ['ipinfo', 'ip'],
  usage: '<ip>',
  category: 'troll',
  type: 'both',
  permissions: ['SendMessages'],
  cooldown: 15,
  execute: async (client, message, args) => {
    if (args[0] && ['help', '--help', '-h'].includes(args[0].toLowerCase())) {
      return message.channel.send(`> **IP Lookup Help**\n> Usage: \`${client.prefix}iplookup <ip>\`\n> Aliases: \`${client.prefix}ipinfo\`, \`${client.prefix}ip\``);
    }

    const ip = args[0];
    if (!ip) return message.channel.send(formatThreeBlock('Barro IPLookup', [[style('Target', '0;30'), style('Unknown', '37')]], [[style('Result', '0;30'), style('Please provide an IP address.', '37')]]));
    try {
      const response = await axios.get(`https://ipapi.co/${ip}/json/`);
      const data = response.data;
      const rows = [
        ['IP', data.ip || 'N/A'], ['City', data.city || 'N/A'], ['Region', data.region || 'N/A'],
        ['Country', data.country_name || 'N/A'], ['Post Code', data.postal || 'N/A'], ['Timezone', data.timezone || 'N/A'],
        ['Org', data.org || 'N/A'], ['ASN', data.asn || 'N/A'], ['Location', `${data.latitude || 'N/A'}, ${data.longitude || 'N/A'}`]
      ];
      return message.channel.send(formatThreeBlock('Barro IPLookup', [[style('Target', '0;30'), style(ip, '37')]], rows.map(([k, v]) => [style(k, '0;30'), style(v, '37')])));
    } catch (error) {
      log(`Error fetching IP details: ${error.message}`, 'error');
      return message.channel.send(formatThreeBlock('Barro IPLookup', [[style('Target', '0;30'), style(ip, '37')]], [[style('Result', '0;30'), style('Failed to get IP information.', '37')]]));
    }
  }
};

function style(text, colorCode) { return `\u001b[${colorCode}m${text}\u001b[0m`; }
function formatAnsiBlocks(blocks) {
  const [firstBlock, ...remainingBlocks] = blocks;
  const output = ['> ```ansi', ...firstBlock.map(line => `> ${line}`)];
  remainingBlocks.forEach(block => output.push('> ``````ansi', ...block.map(line => `> ${line}`)));
  output.push('> ```');
  return output.join('\n');
}
function formatThreeBlock(title, block2Rows, block3Rows) {
  const clean = (value) => String(value).replace(/\u001b\[[0-9;]*m/g, '');
  const width = [...block2Rows, ...block3Rows].reduce((max, [label]) => Math.max(max, clean(label).length), 0);
  const renderRows = (rows) => rows.map(([label, value]) => {
    const left = clean(label).padEnd(width, ' ');
    return style(left, THEME.LABEL_COLOR) + style(' | ', THEME.DIVIDER_COLOR) + style(clean(value), THEME.ACCENT_COLOR);
  });
  return formatAnsiBlocks([[formatHeaderTitle(title)], renderRows(block2Rows), renderRows(block3Rows)]);
}
