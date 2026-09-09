import { readAfkData, writeAfkData } from '../../utils/afkHandler.js';
import { log } from '../../utils/functions.js';
import { THEME } from '../../utils/theme.js';

export default {
    name: 'afk',
    description: 'Set your away status',
    aliases: [],
    usage: '[reason]',
    category: 'general',
    type: 'both',
    permissions: ['SendMessages'],
    cooldown: 30,

    execute: async (client, message, args) => {
      if (args[0] && ['help', '--help', '-h'].includes(args[0].toLowerCase())) {
        return message.channel.send(`> **AFK Help**\n> Usage: \`${client.prefix}afk [reason]\`\n> Aliases: none`);
      }
        try {
            const reason = args.length > 0 ? args.join(' ') : 'No reason provided';
            const afkData = readAfkData();

            afkData[message.author.id] = {
                reason: reason,
                timestamp: Date.now()
            };

            writeAfkData(afkData);

            await message.channel.send(formatAnsiBlock([
<<<<<<< HEAD:commands/general/afk.js
              style('[ AFK ]', THEME.HEADER_BOLD_COLOR, true),
              '',
              style('STATUS:', THEME.LABEL_COLOR) + ' ' + style('You are now AFK.', THEME.ACCENT_COLOR),
              style('REASON:', THEME.LABEL_COLOR) + ' ' + style(reason, THEME.ACCENT_COLOR)
=======
              style('[ AFK ]', '0;30'),
              '',
              style('STATUS:', '0;34') + ' ' + style('You are now AFK.', '0;97'),
              style('REASON:', '0;34') + ' ' + style(reason, '0;97')
>>>>>>> origin/main:commands/utility/afk.js
            ]));
            log(`${message.author.tag} is now AFK. Reason: ${reason}`, 'info');

        } catch (error) {
            console.error('[ERROR] Error in afk command:', error);
            message.channel.send(formatAnsiBlock([
<<<<<<< HEAD:commands/general/afk.js
              style('[ AFK ]', THEME.HEADER_BOLD_COLOR, true),
              '',
              style('ERROR:', THEME.LABEL_COLOR) + ' ' + style('An error occurred while setting your AFK status.', THEME.ACCENT_COLOR)
=======
              style('[ AFK ]', '0;30'),
              '',
              style('ERROR:', '0;34') + ' ' + style('An error occurred while setting your AFK status.', '0;97')
>>>>>>> origin/main:commands/utility/afk.js
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