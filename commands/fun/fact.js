import axios from "axios";

export default {
  name: "fact",
  aliases: ["randomfact", "facts"],
  description: "Get random facts and number trivia",
  usage: "fact [useless|number]",
  category: "fun",
  cooldown: 3,

  async execute(client, message, args) {
    const type = args[0]?.toLowerCase();

    try {
      if (type === "useless") {
        const response = await axios.get(
          "https://uselessfacts.jsph.pl/random.json?language=en"
        );
        const fact = response.data.text;
        await message.channel.send(`📚 **Useless Fact:** ${fact}`);
      } else if (type === "number") {
        const response = await axios.get(
          "http://numbersapi.com/random/trivia?json"
        );
        const fact = response.data.text;
        await message.channel.send(`🔢 **Number Trivia:** ${fact}`);
      } else {
        // Default to useless fact
        const response = await axios.get(
          "https://uselessfacts.jsph.pl/random.json?language=en"
        );
        const fact = response.data.text;
        await message.channel.send(`📚 **Random Fact:** ${fact}`);
      }
    } catch (error) {
      await message.channel.send(
        "❌ Failed to get a fact! Please try again later."
      );
    }
  },
};
