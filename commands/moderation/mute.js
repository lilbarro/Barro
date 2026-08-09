export default {
    name: 'mute',
    description: 'Timeout/mute a member for a specified duration.',
    aliases: ['timeout', 'silence', "stfu", "shutup", "sybau"],
    usage: '<@member> <duration> [reason]',
    category: 'moderation',
    type: 'server_only',
    permissions: ['ModerateMembers'],
    cooldown: 5,

    execute: async (client, message, args) => {
        const targets = [];
        let reason = null;
        let duration = null;

        // Extract multiple users from mentions or IDs and parse duration
        for (let arg of args) {
            if (message.mentions.members.size > 0 && !reason) {
                targets.push(...message.mentions.members.map(m => m.id));
            } else if (!isNaN(arg)) {
                try {
                    const member = await message.guild.members.fetch(arg);
                    targets.push(member.id);
                } catch (error) {
                    message.channel.send(`> ❌ Member with ID ${arg} not found.`);
                }
            } else if (!duration && /\d+[smhd]/.test(arg)) { // Parse duration (e.g., 5m, 1h)
                duration = arg;
            } else {
                reason = args.slice(targets.length + (duration ? 1 : 0)).join(' ');
                break;
            }
        }

        if (targets.length === 0 || !duration) {
            return message.channel.send(`> ❌ **Incorrect Usage!**\nUsage: \`${client.prefix}mute <@member/ID> <duration> [reason]\`\nExample: \`${client.prefix}mute @user 5m Spamming\``);
        }

        for (const targetId of targets) {
            try {
                const member = await message.guild.members.fetch(targetId);

                if (member.roles.highest.position >= message.member.roles.highest.position) {
                    message.channel.send(`> ❌ You cannot mute ${member.user.tag} due to role hierarchy.`);
                    continue;
                }

                // Apply timeout (convert duration to milliseconds)
                const timeMs = parseDuration(duration); // Helper function to parse duration
                if (!timeMs) {
                    message.channel.send(`> ❌ Invalid duration format. Use \`<number>[s/m/h/d]\` (e.g., 5m).`);
                    continue;
                }

                await member.timeout(timeMs, reason ? `${reason} | Executed by: ${message.author.tag}` : `Executed by: ${message.author.tag}`);
                message.channel.send(`> 🔇 Timed out ${member.user.tag} for ${duration} ${reason ? `| Reason: ${reason}` : ''}`);
            } catch (error) {
                message.channel.send(`> ❌ Failed to timeout ID: ${targetId}. Error: ${error.message}`);
            }
        }
    },
};