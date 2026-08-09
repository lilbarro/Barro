export default {
  name: "dice",
  aliases: ["roll", "rolldice"],
  description: "Roll a dice with custom number of sides",
  usage: "dice [sides]",
  category: "fun",
  cooldown: 2,

  async execute(client, message, args) {
    let sides = parseInt(args[0]) || 6;

    if (sides < 1) {
      return message.channel.send("❌ Number of sides must be at least 1!");
    }

    if (sides > 1000) {
      return message.channel.send("❌ Maximum number of sides is 1000!");
    }

    const number = Math.floor(Math.random() * sides) + 1;
    await message.channel.send(
      `🎲 Rolling a ${sides}-sided dice...\nYou rolled a **${number}**!`
    );
  },
};
