export default {
  name: "rps",
  aliases: ["rockpaperscissors"],
  description: "Play rock paper scissors with the bot",
  usage: "rps",
  category: "fun",
  cooldown: 2,

  async execute(client, message, args) {
    const choices = ["🪨 rock", "📜 paper", "✂️ scissors"];
    const choice = choices[Math.floor(Math.random() * choices.length)];

    await message.channel.send(`I choose **${choice}**!`);
  },
};
