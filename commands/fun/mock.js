export default {
  name: "mock",
  aliases: ["spongebob", "mocksponge"],
  description: "Convert text to mocking spongebob format",
  usage: "mock <text>",
  category: "fun",
  cooldown: 2,

  async execute(client, message, args) {
    const text = args.join(" ");

    if (!text) {
      return message.channel.send("❌ Please provide some text to mock!");
    }

    const mocked = text
      .split("")
      .map((char, index) => {
        return index % 2 === 0 ? char.toLowerCase() : char.toUpperCase();
      })
      .join("");

    await message.channel.send(mocked);
  },
};
