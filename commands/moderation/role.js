import { log } from '../../utils/functions.js';

export default {
    name: 'role',
    description: 'Add or remove a role from a user.',
    aliases: ['giverole', 'removerole', 'rolemod'],
    usage: '{prefix}role <add/remove> <@user> <role/ID>',
    category: 'moderation',
    type: 'server_only',
    permissions: ['ManageRoles'],
    cooldown: 5,

    execute: async (client, message, args) => {
        const action = args[0]?.toLowerCase();
        let user = null;
        let role = null;

        // Validate action
        if (!['add', 'remove'].includes(action)) {
            return message.channel.send(`> ❌ Invalid action! Usage: \`${client.prefix}role <add/remove> <@user/ID> <role/ID>\``);
        }

        // Parse user input (mention or ID)
        if (message.mentions.members.size > 0) {
            user = message.mentions.members.first();
        } else if (!isNaN(args[1])) {
            try {
                user = await message.guild.members.fetch(args[1]);
            } catch (error) {
                return message.channel.send(`> ❌ Invalid user ID: ${args[1]}`);
            }
        }

        if (!user) {
            return message.channel.send(`> ❌ Please provide a valid user mention or ID.`);
        }

        // Parse role input (mention or ID)
        if (message.mentions.roles.size > 0) {
            role = message.mentions.roles.first();
        } else if (!isNaN(args[2])) {
            role = message.guild.roles.cache.get(args[2]);
        } else {
            role = message.guild.roles.cache.find(r => r.name.toLowerCase() === args[2]?.toLowerCase());
        }

        if (!role) {
            return message.channel.send(`> ❌ Role not found!`);
        }

        // Prevent role management beyond user's highest role
        if (role.position >= message.member.roles.highest.position) {
            return message.channel.send(`> ❌ You can't manage a role higher than or equal to your highest role.`);
        }

        try {
            if (action === 'add') {
                if (user.roles.cache.has(role.id)) {
                    return message.channel.send(`> ❌ ${user.user.tag} already has the role ${role.name}.`);
                }
                await user.roles.add(role);
                message.channel.send(`> ➕ Added role ${role.name} to ${user.user.tag}`);
            } else if (action === 'remove') {
                if (!user.roles.cache.has(role.id)) {
                    return message.channel.send(`> ❌ ${user.user.tag} does not have the role ${role.name}.`);
                }
                await user.roles.remove(role);
                message.channel.send(`> ➖ Removed role ${role.name} from ${user.user.tag}`);
            }
        } catch (error) {
            log(`Error managing role: ${error.message}`, 'error');
            message.channel.send(`> ❌ Failed to manage role: ${error.message}`);
        }
    },
};