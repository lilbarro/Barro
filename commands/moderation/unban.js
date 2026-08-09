export default {
    name: 'unban',
    description: 'Unban a user by ID or name#discriminator.',
    aliases: ['pardon', 'unbanuser'],
    usage: '<userID/name#discriminator> [reason]',
    category: 'moderation',
    type: 'server_only',
    permissions: ['BanMembers'],
    cooldown: 5,

    execute: async (client, message, args) => {
        const targets = [];
        let reason = null;

        // Extract multiple user IDs and optional reason
        for (let arg of args) {
            if (!isNaN(arg)) {
                targets.push(arg);
            } else {
                reason = args.slice(targets.length).join(' ');
                break;
            }
        }

        if (targets.length === 0) {
            return message.channel.send(`> ❌ **Incorrect Usage!**\nUsage: \`${client.prefix}unban <userID1> [userID2] ... [reason]\`\nExample: \`${client.prefix}unban 123456789012345678 987654321098765432 Cleared violations\``);
        }

        for (const targetId of targets) {
            try {
                const bans = await message.guild.bans.fetch();
                const bannedUser = bans.find(ban => ban.user.id === targetId);

                if (!bannedUser) {
                    message.channel.send(`> ❌ User ID ${targetId} is not found in the ban list.`);
                    continue;
                }

                await message.guild.members.unban(bannedUser.user, reason ? `${reason} | Executed by: ${message.author.tag}` : `Executed by: ${message.author.tag}`);
                message.channel.send(`> ✅ Unbanned user ID ${targetId} ${reason ? `| Reason: ${reason}` : ''}`);
            } catch (error) {
                message.channel.send(`> ❌ Failed to unban user ID ${targetId}. Error: ${error.message}`);
            }
        }
    },
};