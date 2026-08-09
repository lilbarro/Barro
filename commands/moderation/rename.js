import { log } from '../../utils/functions.js';

export default {
    name: 'rename',
    description: 'Change a member\'s nickname',
    aliases: ['nick', 'nickname', 'setnick'],
    usage: 'rename <@member> [nickname]',
    category: 'moderation',
    type: 'server_only',
    permissions: ['ManageNicknames'],
    cooldown: 5,

    execute: async (client, message, args) => {
        const member = message.mentions.members.first();
        if (!member) {
            return message.channel.send('> ❌ Please mention a valid member.');
        }

        // Check role hierarchy
        if (member.roles.highest.position >= message.member.roles.highest.position) {
            return message.channel.send('> ❌ Cannot rename someone with higher or equal role!');
        }

        const nickname = args.slice(1).join(' ') || null;

        try {
            await member.setNickname(nickname);
            if (nickname) {
                message.channel.send(`> ✏️ Changed ${member}'s nickname to: ${nickname}`);
            } else {
                message.channel.send(`> ✏️ Reset ${member}'s nickname`);
            }
        } catch (error) {
            log(`Failed to change nickname: ${error.message}`, 'error');
            message.channel.send(`> ❌ Failed to change nickname: ${error.message}`);
        }
    },
};