import { THEME } from "../../utils/theme.js";

export default {
    name: 'banner',
    description: "Display user/server banner",
    aliases: ['b'],
    usage: '[user mention/id | server]',
    category: 'general',
    type: 'both',
    permissions: ['SendMessages'],    cooldown: 3,
    async execute(client, message, args) {
        if (args[0] && ['help', '--help', '-h'].includes(args[0].toLowerCase())) {
            return message.channel.send(`> **Banner Help**\n> Usage: \`${client.prefix}banner [user mention/id | server]\`\n> Aliases: ${client.prefix}b`);
        }
        let targetUser = null;
        let targetGuild = null;
        let bannerName = "";

        if (args.length > 0) {
            const arg = args[0].toLowerCase();
            if (arg === 'server' || arg === 'guild') {
                if (message.guild) {
                    targetGuild = message.guild;
                    bannerName = `${message.guild.name}'s`;
                } else {
                    return message.channel.send(formatAnsiBlock([
                      style('[ BANNER ]', THEME.HEADER_BOLD_COLOR),
                      '',
                      style('ERROR:', THEME.LABEL_COLOR) + ' ' + style('This command can only fetch server banners in a guild channel.', THEME.ACCENT_COLOR)
                    ]));
                }
            } else {
                // Try to find a mentioned user
                const mentionedUser = message.mentions.users.first();
                if (mentionedUser) {
                    targetUser = mentionedUser;
                    bannerName = `${targetUser.username}'s`;
                } else {
                    // Try to find user by ID
                    const userId = args[0].replace(/[^0-9]/g, ''); // Extract ID from potential mention or raw ID
                    if (userId) {
                        try {
                            // Force fetch user to ensure banner property is populated
                            const fetchedUser = await client.users.fetch(userId, { force: true });
                            if (fetchedUser) {
                                targetUser = fetchedUser;
                                bannerName = `${targetUser.username}'s`;
                            } else {
                                return message.channel.send(`> ❌ **Error:** Could not find a user with that ID. Usage: \`${client.prefix}banner [user mention/id | server]\``);
                            }
                        } catch (error) {
                            console.error("Error fetching user for banner:", error);
                            return message.channel.send(`> ❌ **Error:** Invalid argument or user not found. Usage: \`${client.prefix}banner [user mention/id | server]\``);
                        }
                    } else {
                        // If no valid argument, default to author
                        targetUser = message.author;
                        bannerName = "Your";
                    }
                }
            }
        } else {
            // No arguments, default to author
            targetUser = message.author;
            bannerName = "Your";
        }

        let bannerURL = null;
        if (targetGuild) {
            bannerURL = targetGuild.bannerURL({ size: 1024 });
        } else if (targetUser) {
            // Ensure the user object has the banner property populated by re-fetching with force: true
            const fullUser = await client.users.fetch(targetUser.id, { force: true });
            bannerURL = fullUser.bannerURL({ size: 1024 });
        }

        if (!bannerURL) {
            const lines = [
              style('[ BANNER ]', THEME.HEADER_BOLD_COLOR),
              '',
              style('INFO:', THEME.LABEL_COLOR) + ' ' + style(`${bannerName} doesn't have a banner.`, THEME.ACCENT_COLOR)
            ];
            if (targetUser) {
              lines.push(style('NOTE:', THEME.LABEL_COLOR) + ' ' + style('Users need Discord Nitro to set a banner.', THEME.ACCENT_COLOR));
            } else if (targetGuild) {
              lines.push(style('NOTE:', THEME.LABEL_COLOR) + ' ' + style('Servers need a certain boost level to set a banner.', THEME.ACCENT_COLOR));
            }
            return message.channel.send(formatAnsiBlock(lines));
        }

        const messageContent = `> **${bannerName} Banner**\n> ${bannerURL}\n> [Download Link](${bannerURL})`;

        message.channel.send(messageContent);
    },
};

function style(text, colorCode) {
  return `\u001b[${colorCode}m${text}\u001b[0m`;
}

function formatAnsiBlock(lines) {
  return ['> ```ansi', ...lines.map(line => `> ${line}`), '> ```'].join('\n');
}