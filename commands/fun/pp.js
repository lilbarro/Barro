export default {
  name: "pp",
  aliases: ["ppsize", "size"],
  description: "Get a user's random pp size",
  usage: "pp [@user]",
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

    const length = Math.floor(Math.random() * 13);
    const pp = "8" + "=".repeat(length) + "D";

    await message.channel.send(
      `📏 **${user.username}'s pp size:**\n${pp} (${pp.length}")`
    );
  },
};
