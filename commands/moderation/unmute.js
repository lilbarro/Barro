export default {
    name: 'unmute',
    description: 'Remove timeout/mute from a member.',
    aliases: ['untimeout', 'unsilence'],
    usage: '<@member> [reason]',
    category: 'moderation',
    type: 'server_only',
    permissions: ['ModerateMembers'],
    cooldown: 5,

    execute: async (client, message, args) => {
        const targets = [];
        let reason = null;

        // Extract multiple users from mentions or IDs and parse optional reason
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
            } else {
                reason = args.slice(targets.length).join(' ');
                break;
            }
        }

        if (targets.length === 0) {
            return message.channel.send(`> ❌ **Incorrect Usage!**\nUsage: \`${client.prefix}unmute <@member/ID> [reason]\`\nExample: \`${client.prefix}unmute @user Cleared violations\``);
        }

        for (const targetId of targets) {
            try {
                const member = await message.guild.members.fetch(targetId);

                if (member.communicationDisabledUntilTimestamp === null) {
                    message.channel.send(`> ❌ ${member.user.tag} is not currently muted.`);
                    continue;
                }

                await member.timeout(null, reason ? `${reason} | Executed by: ${message.author.tag}` : `Executed by: ${message.author.tag}`);
                message.channel.send(`> 🔊 Unmuted ${member.user.tag}${reason ? ` | Reason: ${reason}` : ''}`);
            } catch (error) {
                message.channel.send(`> ❌ Failed to unmute ID: ${targetId}. Error: ${error.message}`);
            }
        }
    },
};