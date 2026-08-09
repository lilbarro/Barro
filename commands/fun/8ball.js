export default {
  name: "8ball",
  aliases: ["eightball", "8b", "fortune"],
  description: "Ask the magic 8ball a question",
  usage: "8ball <question>",
  category: "fun",
  cooldown: 2,

  async execute(client, message, args) {
    const question = args.join(" ");

    if (!question) {
      return message.channel.send("❌ Please ask a question!");
    }

    const responses = [
      "It is certain",
      "It is decidedly so",
      "Without a doubt",
      "Yes definitely",
      "You may rely on it",
      "Most likely",
      "Outlook good",
      "Yes",
      "Signs point to yes",
      "Ask again later",
      "Better not tell you now",
      "Cannot predict now",
      "Don't count on it",
      "My reply is no",
      "Very doubtful",
    ];

    const answer = responses[Math.floor(Math.random() * responses.length)];
    await message.channel.send(
      `🎱 **Question:** ${question}\n**Answer:** ${answer}`
    );
  },
};
