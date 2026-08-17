export default {
    name: 'status',
    description: "Changes the bot's online status (online, idle, dnd, invisible)",
    aliases: [],
    usage: '<online|idle|dnd|invisible>',
    category: 'status',
    type: 'both',
    permissions: ['SendMessages'],
    cooldown: 5,
    async execute(client, message, args) {
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