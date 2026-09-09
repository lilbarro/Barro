import { THEME } from "../../utils/theme.js";

export default {
    name: 'avatar',
    description: "Display user/server avatar",
    aliases: ['av', 'pfp'],
    usage: '[user mention/id | server | bot]',
    category: 'general',
    type: 'both',
    permissions: ['SendMessages'],
    cooldown: 10,
    async execute(client, message, args) {
        if (args[0] && ['help', '--help', '-h'].includes(args[0].toLowerCase())) {
            return message.channel.send(`> **Avatar Help**\n> Usage: \`${client.prefix}avatar [user mention/id | server | bot]\`\n> Aliases: ${client.prefix}av, ${client.prefix}pfp`);
        }
        let target = message.author; // Default to message author
        let avatarURL = null;
        let avatarName = "Your";
        let isGuildAvatar = false;

        if (args.length > 0) {
            const arg = args[0].toLowerCase();
            if (arg === 'server' || arg === 'guild') {
                if (message.guild) {
                    avatarURL = message.guild.iconURL({ dynamic: true, size: 1024 });
                    avatarName = `${message.guild.name}'s`;
                    isGuildAvatar = true;
                } else {
                    return message.channel.send(formatAnsiBlock([
<<<<<<< HEAD:commands/general/avatar.js
                      style(' Avatar ', THEME.HEADER_BOLD_COLOR, true),
                      '',
                      style(' Error: ', THEME.LABEL_COLOR) + ' ' + style('This command can only fetch server avatars in a guild channel.', THEME.ACCENT_COLOR)
=======
                      style(' Avatar ', '0;30'),
                      '',
                      style(' Error: ', '0;97') + ' ' + style('This command can only fetch server avatars in a guild channel.', '0;34')
>>>>>>> origin/main:commands/utility/avatar.js
                    ]));
                }
            } else if (arg === 'bot' || arg === 'self') {
                target = client.user;
                avatarName = "My";
            } else {
                // Try to find a mentioned user
                const mentionedUser = message.mentions.users.first();
                if (mentionedUser) {
                    target = mentionedUser;
                    avatarName = `${target.username}'s`;
                } else {
                    // Try to find user by ID
                    const userId = args[0].replace(/[^0-9]/g, ''); // Extract ID from potential mention or raw ID
                    try {
                        const fetchedUser = await client.users.fetch(userId);
                        if (fetchedUser) {
                            target = fetchedUser;
                            avatarName = `${target.username}'s`;
                        } else {
                            return message.channel.send(formatAnsiBlock([
<<<<<<< HEAD:commands/general/avatar.js
                              style(' Avatar ', THEME.HEADER_BOLD_COLOR, true),
                              '',
                              style(' Error: ', THEME.LABEL_COLOR) + ' ' + style('Could not find a user with that ID.', THEME.ACCENT_COLOR),
                              style(' Usage: ', THEME.LABEL_COLOR) + ' ' + style(`${client.prefix}avatar [user mention/id | server | bot]`, THEME.ACCENT_COLOR)
=======
                              style(' Avatar ', '4;30'),
                              '',
                              style(' Error: ', '0;97') + ' ' + style('Could not find a user with that ID.', '0;34'),
                              style(' Usage: ', '0;97') + ' ' + style(`${client.prefix}avatar [user mention/id | server | bot]`, '0;34')
>>>>>>> origin/main:commands/utility/avatar.js
                            ]));
                        }
                    } catch (error) {
                        return message.channel.send(formatAnsiBlock([
<<<<<<< HEAD:commands/general/avatar.js
                          style(' Avatar ', THEME.HEADER_BOLD_COLOR, true),
                          '',
                          style(' Error: ', THEME.LABEL_COLOR) + ' ' + style('Invalid argument or user not found.', THEME.ACCENT_COLOR),
                          style(' Usage: ', THEME.LABEL_COLOR) + ' ' + style(`${client.prefix}avatar [user mention/id | server | bot]`, THEME.ACCENT_COLOR)
=======
                          style(' Avatar ', '4;30'),
                          '',
                          style(' Error: ', '0;97') + ' ' + style('Invalid argument or user not found.', '0;34'),
                          style(' Usage: ', '0;97') + ' ' + style(`${client.prefix}avatar [user mention/id | server | bot]`, '0;34')
>>>>>>> origin/main:commands/utility/avatar.js
                        ]));
                    }
                }
            }
        }

        if (!isGuildAvatar) {
            avatarURL = target.displayAvatarURL({ dynamic: true, size: 1024 });
        }

        if (!avatarURL) {
            return message.channel.send(formatAnsiBlock([
<<<<<<< HEAD:commands/general/avatar.js
              style(' Avatar ', THEME.HEADER_BOLD_COLOR, true),
              '',
              style(' Info: ', THEME.LABEL_COLOR) + ' ' + style(`${avatarName} doesn't have an avatar.`, THEME.ACCENT_COLOR)
=======
              style(' Avatar ', '4;30'),
              '',
              style(' Info: ', '0;97') + ' ' + style(`${avatarName} doesn't have an avatar.`, '0;34')
>>>>>>> origin/main:commands/utility/avatar.js
            ]));
        }

        const messageContent = `> **${avatarName} Avatar**
> ${avatarURL}
> [Download Link](${avatarURL})`;

        message.channel.send(messageContent);
    },
};

function style(text, colorCode) {
  return `\u001b[${colorCode}m${text}\u001b[0m`;
}

function formatAnsiBlock(lines) {
  return ['> ```ansi', ...lines.map(line => `> ${line}`), '> ```'].join('\n');
}