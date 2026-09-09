export default {
    name: 'status',
<<<<<<< HEAD
    description: "Change bot status",
=======
    description: "Changes the bot's online status (online, idle, dnd, invisible)",
>>>>>>> origin/main
    aliases: [],
    usage: '<online|idle|dnd|invisible>',
    category: 'status',
    type: 'both',
    permissions: ['SendMessages'],
    cooldown: 5,
    async execute(client, message, args) {
<<<<<<< HEAD
        if (args[0] && ['help', '--help', '-h'].includes(args[0].toLowerCase())) {
            return message.channel.send(`> **Status Help**\n> Usage: \`${client.prefix}status <online|idle|dnd|invisible>\`\n> Aliases: none`);
        }

=======
>>>>>>> origin/main
        const newStatus = args[0] ? args[0].toLowerCase() : null;
        const validStatuses = ['online', 'idle', 'dnd', 'invisible'];

        if (!newStatus || !validStatuses.includes(newStatus)) {
            return message.channel.send(`Usage: \`${client.prefix}status <online|idle|dnd|invisible>\`\nValid statuses are: ${validStatuses.join(', ')}`);
        }

        try {
            await client.user.setStatus(newStatus);
            message.channel.send(`> ✅ Bot status changed to **${newStatus.toUpperCase()}**!`);
        } catch (error) {
            console.error('Error changing bot status:', error);
            message.channel.send('> ❌ **Error:** Failed to change bot status. Check console for details.');
        }
    },
};