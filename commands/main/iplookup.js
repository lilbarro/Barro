import { log } from "../../utils/functions.js";
import axios from 'axios';

export default {
  name: 'iplookup',
  description: 'Get detailed information about an IP address.',
  aliases: ['ipinfo', 'ip'],
  usage: '<ip>',
  category: 'misc',
  type: 'both',
  permissions: ['SendMessages'],
  cooldown: 15,
  execute: async (client, message, args) => {
    const ip = args[0];
    if (!ip) return message.channel.send(formatThreeBlock('Barro IPLookup', [[style('Target', '0;30'), style('Unknown', '0;97')]], [[style('Result', '0;30'), style('Please provide an IP address.', '0;97')]]));
    try {
      const response = await axios.get(`https://ipapi.co/${ip}/json/`);
      const data = response.data;
      const rows = [
        ['IP', data.ip || 'N/A'],
        ['City', data.city || 'N/A'],
        ['Region', data.region || 'N/A'],
        ['Country', data.country_name || 'N/A'],
        ['Post Code', data.postal || 'N/A'],
        ['Timezone', data.timezone || 'N/A'],
        ['Org', data.org || 'N/A'],
        ['ASN', data.asn || 'N/A'],
        ['Location', `${data.latitude || 'N/A'}, ${data.longitude || 'N/A'}`]
      ];
      return message.channel.send(formatThreeBlock(
        'Barro IPLookup',
        [[style('Target', '0;30'), style(ip, '0;97')]],
        rows.map(([k, v]) => [style(k, '0;30'), style(v, '0;97')])
      ));
    } catch (error) {
      log(`Error fetching IP details: ${error.message}`, 'error');
      return message.channel.send(formatThreeBlock('Barro IPLookup', [[style('Target', '0;30'), style(ip, '0;97')]], [[style('Result', '0;30'), style('Failed to get IP information.', '0;97')]]));
    }
  }
};

function style(text, colorCode) { return `\u001b[${colorCode}m${text}\u001b[0m`; }
function formatAnsiBlock(lines) { return ['> ```ansi', ...lines.map(line => `> ${line}`), '> ```'].join('\n'); }
function formatThreeBlock(title, block2Rows, block3Rows) {
  const clean = (value) => String(value).replace(/\u001b\[[0-9;]*m/g, '');
  const width = [...block2Rows, ...block3Rows].reduce((max, [label]) => Math.max(max, clean(label).length), 0);
  const renderRows = (rows) => rows.map(([label, value]) => {
    const left = clean(label).padEnd(width, ' ');
    return style(left, '0;97') + style(' | ', '0;30') + style(clean(value), '0;34');
  });
  return [formatAnsiBlock([style(title, '0;30')]), formatAnsiBlock(renderRows(block2Rows)), formatAnsiBlock(renderRows(block3Rows))].join('\n');
}
