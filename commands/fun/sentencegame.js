export default {
  name: "sentencegame",
  aliases: ["story", "buildstory"],
  description: "Start a collaborative story building game",
  usage: "sentencegame",
  category: "fun",
  cooldown: 5,

  async execute(client, message, args) {
    await message.channel.send(
      "🎮 Let's build a story! Start with a word or short phrase."
    );

    const filter = (m) =>
      m.author.id === message.author.id && m.channel.id === message.channel.id;

    try {
      const collected = await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 30000,
        errors: ["time"],
      });

      const firstMessage = collected.first();
      let sentence = firstMessage.content;

      await message.channel.send(`**Current story:** ${sentence}\nAdd to it!`);

      // Continue the story for up to 5 more additions
      for (let i = 0; i < 5; i++) {
        try {
          const nextCollected = await message.channel.awaitMessages({
            filter,
            max: 1,
            time: 30000,
            errors: ["time"],
          });

          const nextMessage = nextCollected.first();
          sentence += " " + nextMessage.content;

          if (i < 4) {
            await message.channel.send(
              `**Current story:** ${sentence}\nKeep going!`
            );
          } else {
            await message.channel.send(
              `📖 **Final Story:** ${sentence}\n\nGreat story! 🎉`
            );
          }
        } catch (error) {
          await message.channel.send(
            `📖 **Final Story:** ${sentence}\n\nStory ended here!`
          );
          break;
        }
      }
    } catch (error) {
      await message.channel.send("❌ Game cancelled - no response received.");
    }
  },
};
