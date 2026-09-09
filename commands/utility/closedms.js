import { formatHeaderTitle, formatAnsiBlocks, style } from "../../utils/functions.js";
import { THEME } from "../../utils/theme.js";

export default {
  name: "closedms",
  aliases: ["closeall"],
  category: "utility",
  ownerOnly: true,
  description: "Close open direct messages",
  async execute(client, message, args) {
    if (args[0] && ['help', '--help', '-h'].includes(args[0].toLowerCase())) {
      return message.channel.send(formatAnsiBlocks([
        [formatHeaderTitle('Barro Close DMs')],
        [style('Usage: ', THEME.LABEL_COLOR) + style(`${client.prefix}closedms`, THEME.ACCENT_COLOR)],
        [style('Alias: ', THEME.LABEL_COLOR) + style(`${client.prefix}closeall`, THEME.ACCENT_COLOR)]
      ]));
    }
    try {
      // Filter for regular DMs only, excluding group DMs (GROUP_DM)
      // Group DMs need to be left separately using leaveGroupDM
      const dmChannels = client.channels.cache.filter(c => c.type === 'DM');
      const groupDMs = client.channels.cache.filter(c => c.type === 'GROUP_DM');
      
      if (dmChannels.size === 0 && groupDMs.size === 0) {
        return message.channel.send(formatAnsiBlocks([
          [formatHeaderTitle('Barro Close DMs')],
          [style('INFO:', THEME.LABEL_COLOR) + ' ' + style('No open DM or group DM channels found.', THEME.ACCENT_COLOR)]
        ]));
      }

      await message.channel.send(formatAnsiBlocks([
        [formatHeaderTitle('Barro Close DMs')],
        [
        style('FOUND:', THEME.LABEL_COLOR),
        style('Regular DMs:', THEME.LABEL_COLOR) + ' ' + style(dmChannels.size.toString(), THEME.ACCENT_COLOR),
        style('Group DMs:', THEME.LABEL_COLOR) + ' ' + style(groupDMs.size.toString(), THEME.ACCENT_COLOR) + ' ' + style('(excluded)', '0;90'),
        style('STATUS:', THEME.LABEL_COLOR) + ' ' + style(`Closing ${dmChannels.size} regular DM channels...`, THEME.ACCENT_COLOR)
        ]
      ]));

      let closedCount = 0;
      let failedCount = 0;
      
      for (const [id, channel] of dmChannels) {
        try {
          // Using the delete method to close the DM
          await channel.delete(); 
          closedCount++;
        } catch (error) {
          failedCount++;
          // Some DMs might fail to close, continue with others
        }
      }

      let resultLines = [
        style('Close DMs', THEME.HEADER_BOLD_COLOR, true),
        '',
        style('RESULT:', THEME.LABEL_COLOR) + ' ' + style(`Successfully closed ${closedCount} regular DM channels.`, THEME.ACCENT_COLOR)
      ];

      if (failedCount > 0) {
        resultLines.push(
          style('FAILED:', THEME.LABEL_COLOR) + ' ' + style(`Failed to close ${failedCount} DM(s).`, THEME.ACCENT_COLOR)
        );
      }

      if (groupDMs.size > 0) {
        resultLines.push(
          style('INFO:', THEME.LABEL_COLOR) + ' ' + style(`${groupDMs.size} group DM(s) were excluded.`, THEME.ACCENT_COLOR)
        );
      }

      return message.channel.send(formatAnsiBlocks([
        [formatHeaderTitle('Barro Close DMs')],
        resultLines.slice(2)
      ]));
    } catch (error) {
      return message.channel.send(formatAnsiBlocks([
        [formatHeaderTitle('Barro Close DMs')],
        [style('ERROR:', THEME.LABEL_COLOR) + ' ' + style(error.message, THEME.ACCENT_COLOR)]
      ]));
    }
  },
};