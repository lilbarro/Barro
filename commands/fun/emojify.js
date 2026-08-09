export default {
  name: "emojify",
  aliases: ["texttoemoji", "emojify_text"],
  description: "Convert text to emoji letters",
  usage: "emojify <text>",
  category: "fun",
  cooldown: 2,

  async execute(client, message, args) {
    const text = args.join(" ");

    if (!text) {
      return message.channel.send("❌ Please provide some text to emojify!");
    }

    const emojiMap = {
      a: "🇦",
      b: "🇧",
      c: "🇨",
      d: "🇩",
      e: "🇪",
      f: "🇫",
      g: "🇬",
      h: "🇭",
      i: "🇮",
      j: "🇯",
      k: "🇰",
      l: "🇱",
      m: "🇲",
      n: "🇳",
      o: "🇴",
      p: "🇵",
      q: "🇶",
      r: "🇷",
      s: "🇸",
      t: "🇹",
      u: "🇺",
      v: "🇻",
      w: "🇼",
      x: "🇽",
      y: "🇾",
      z: "🇿",
    };

    const output = text
      .split("")
      .map((char) => {
        const lower = char.toLowerCase();
        return emojiMap[lower] || char;
      })
      .join(" ");

    if (output.length > 2000) {
      return message.channel.send("❌ Text is too long to emojify!");
    }

    await message.channel.send(output);
  },
};
