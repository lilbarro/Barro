export default {
    name: 'avatar',
    description: "Displays a user's, server's, or bot's avatar.",
    aliases: ['av', 'pfp'],
    usage: '[user mention/id | server | bot]',
    category: 'general',
    type: 'both',
    permissions: ['SendMessages'],
    cooldown: 3,
    async execute(client, message, args) {
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
                      style('[ AVATAR ]', '1;30'),
                      '',
                      style('ERROR:', '1;31') + ' ' + style('This command can only fetch server avatars in a guild channel.', '0;97')
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
                              style('[ AVATAR ]', '1;30'),
                              '',
                              style('ERROR:', '1;31') + ' ' + style('Could not find a user with that ID.', '0;97'),
                              style('USAGE:', '1;31') + ' ' + style(`${client.prefix}avatar [user mention/id | server | bot]`, '0;97')
                            ]));
                        }
                    } catch (error) {
                        return message.channel.send(formatAnsiBlock([
                          style('[ AVATAR ]', '1;30'),
                          '',
                          style('ERROR:', '1;31') + ' ' + style('Invalid argument or user not found.', '0;97'),
                          style('USAGE:', '1;31') + ' ' + style(`${client.prefix}avatar [user mention/id | server | bot]`, '0;97')
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
              style('[ AVATAR ]', '1;30'),
              '',
              style('INFO:', '1;31') + ' ' + style(`${avatarName} doesn't have an avatar.`, '0;97')
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