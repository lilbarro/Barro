export default {
  name: "gay",
  aliases: ["howgay"],
  description: "Check how gay someone is",
  usage: "gay [@user/user_id]",
  category: "fun",
  cooldown: 3,

  async execute(client, message, args) {
    let user = message.author;

    // Check if user mentioned someone or provided user ID
    if (message.mentions.users.size > 0) {
      user = message.mentions.users.first();
    } else if (args[0]) {
      try {
        const userId = args[0].replace(/[<@!>]/g, "");
        if (/^\d+$/.test(userId)) {
          const fetchedUser = await client.users.fetch(userId);
          if (fetchedUser) user = fetchedUser;
        }
      } catch (error) {
        // If user not found, use message author
      }
    }

    const percentage = Math.floor(Math.random() * 125) + 1;

    let emoji, messageText;
    if (percentage > 100) {
      emoji = "🌈";
      messageText = "SUPER GAY!";
    } else if (percentage > 75) {
      emoji = "💖";
      messageText = "Pretty gay!";
    } else if (percentage > 50) {
      emoji = "💫";
      messageText = "Kinda gay!";
    } else if (percentage > 25) {
      emoji = "⭐";
      messageText = "A little gay.";
    } else {
      emoji = "✨";
      messageText = "Not very gay.";
    }

    await message.channel.send(
      `${emoji} **${user.username}** is **${percentage}%** gay! ${messageText}`
    );
  },
};
