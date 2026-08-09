export default {
    name: 'kick',
    description: 'Kick a member from the server.',
    aliases: ['remove', 'yeet'],
    usage: '<@member/ID> [reason]',
    category: 'moderation',
    type: 'server_only',
    permissions: ['KickMembers'],
    cooldown: 5,

    execute: async (client, message, args) => {
        const targets = [];
        let reason = null;

        // Extract multiple users from mentions or IDs
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
            return message.channel.send(`> ❌ **Incorrect Usage!**\nUsage: \`${client.prefix}kick <@member/ID> [reason]\`\nExample: \`${client.prefix}kick @user Breaking rules\``);
        }

        for (const targetId of targets) {
            try {
                const member = await message.guild.members.fetch(targetId);

                if (member.roles && member.roles.highest.position >= message.member.roles.highest.position) {
                    message.channel.send(`> ❌ You cannot kick ${member.user.tag} due to role hierarchy.`);
                    continue;
                }

                await member.kick(reason ? `${reason} | Executed by: ${message.author.tag}` : `Executed by: ${message.author.tag}`);
                message.channel.send(`> 🚮 Kicked ${member.user.tag} ${reason ? `| Reason: ${reason}` : ''}`);
            } catch (error) {
                message.channel.send(`> ❌ Failed to kick ID: ${targetId}. Error: ${error.message}`);
            }
        }
    },
};