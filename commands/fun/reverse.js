export default {
  name: "reverse",
  aliases: ["backwards", "reverse_text"],
  description: "Reverse the given text",
  usage: "reverse <text>",
  category: "fun",
  cooldown: 2,

  async execute(client, message, args) {
    const text = args.join(" ");

    if (!text) {
      return message.channel.send("❌ Please provide some text to reverse!");
    }

    const reversed = text.split("").reverse().join("");
    await message.channel.send(reversed);
  },
};
