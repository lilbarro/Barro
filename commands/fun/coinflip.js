import { wait } from "../../utils/functions.js";

export default {
  name: "coinflip",
  aliases: ["cf", "flip", "coin"],
  description: "Flip a coin and get heads or tails",
  usage: "coinflip",
  category: "fun",
  cooldown: 2,

  async execute(client, message, args) {
    const sides = ["heads", "tails"];

    const msg = await message.channel.send("> 🎲 Flipping the coin...");
    await wait(1000);

    const result = sides[Math.floor(Math.random() * sides.length)];
    await msg.edit(`> 🎲 The coin landed on \`${result}\`!`);
  },
};
