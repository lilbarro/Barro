export default {
  name: "iq",
  aliases: ["iqtest", "intelligence"],
  description: "Get a user's random IQ score",
  usage: "iq [@user]",
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

    const iq = Math.floor(Math.random() * (135 - 45 + 1)) + 45;

    let rating;
    if (iq > 90) rating = "They're very smart!";
    else if (iq > 70) rating = "They're just below average.";
    else if (iq > 50) rating = "They might have some issues.";
    else rating = "They're severely challenged.";

    await message.channel.send(
      `🧠 **${user.username}'s IQ Test**\nIQ Score: ${iq}\n${rating}`
    );
  },
};
