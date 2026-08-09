export default {
  name: "numberguess",
  aliases: ["guessnumber", "numbergame"],
  description: "Play a number guessing game",
  usage: "numberguess",
  category: "fun",
  cooldown: 5,

  async execute(client, message, args) {
    const number = Math.floor(Math.random() * 100) + 1;
    await message.channel.send(
      "🎮 I'm thinking of a number between 1 and 100. You have 5 tries!"
    );

    const filter = (m) =>
      m.author.id === message.author.id && m.channel.id === message.channel.id;

    for (let i = 0; i < 5; i++) {
      try {
        const collected = await message.channel.awaitMessages({
          filter,
          max: 1,
          time: 30000,
          errors: ["time"],
        });

        const guess = collected.first();
        const guessNumber = parseInt(guess.content);

        if (isNaN(guessNumber)) {
          await message.channel.send("❌ Please enter a valid number!");
          i--; // Don't count invalid guesses
          continue;
        }

        if (guessNumber === number) {
          return message.channel.send(`🎉 Correct! The number was ${number}!`);
        } else if (guessNumber < number) {
          await message.channel.send(`📈 Higher! (${4 - i} tries left)`);
        } else {
          await message.channel.send(`📉 Lower! (${4 - i} tries left)`);
        }
      } catch (error) {
        return message.channel.send(
          `❌ Game over - no response received. The number was ${number}!`
        );
      }
    }

    await message.channel.send(`❌ Game over! The number was ${number}!`);
  },
};
