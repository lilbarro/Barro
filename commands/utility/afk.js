import { readAfkData, writeAfkData } from '../../utils/afkHandler.js';
import { log } from '../../utils/functions.js';

export default {
    name: 'afk',
    description: 'Set your AFK status.',
    aliases: [],
    usage: '[reason]',
    category: 'general',
    type: 'both',
    permissions: ['SendMessages'],
    cooldown: 30,

    execute: async (client, message, args) => {
        try {
            const reason = args.length > 0 ? args.join(' ') : 'No reason provided';
            const afkData = readAfkData();

            afkData[message.author.id] = {
                reason: reason,
                timestamp: Date.now()
            };

            writeAfkData(afkData);

            await message.channel.send(formatAnsiBlock([
              style('[ AFK ]', '0;30'),
              '',
              style('STATUS:', '0;34') + ' ' + style('You are now AFK.', '0;97'),
              style('REASON:', '0;34') + ' ' + style(reason, '0;97')
            ]));
            log(`${message.author.tag} is now AFK. Reason: ${reason}`, 'info');

        } catch (error) {
            console.error('[ERROR] Error in afk command:', error);
            message.channel.send(formatAnsiBlock([
              style('[ AFK ]', '0;30'),
              '',
              style('ERROR:', '0;34') + ' ' + style('An error occurred while setting your AFK status.', '0;97')
            ]));
        }
    }
};

function style(text, colorCode) {
  return `\u001b[${colorCode}m${text}\u001b[0m`;
}

function formatAnsiBlock(lines) {
  return ['> ```ansi', ...lines.map(line => `> ${line}`), '> ```'].join('\n');
}