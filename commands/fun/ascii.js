import figlet from "figlet";

export default {
  name: "ascii",
  aliases: ["asciiart", "figlet", "big"],
  description: "Convert text to ASCII art",
  usage: 'ascii [font] <text> (Use "ascii fonts" to see available fonts)',
  category: "fun",
  cooldown: 3,

  async execute(client, message, args) {
    if (!args.length) {
      return message.channel.send("❌ Please provide some text to convert!");
    }

    const input = args.join(" ");

    if (input.toLowerCase() === "fonts") {
      const popularFonts = [
        "Standard",
        "Slant",
        "Banner3-D",
        "Isometric1",
        "Doom",
        "Digital",
      ];
      let fontList = "🎨 **Popular ASCII Fonts:**\n";

      for (const font of popularFonts) {
        try {
          const sample = figlet.textSync("ABC", { font: font });
          fontList += `**${font}:**\n\`\`\`${sample}\`\`\`\n`;
        } catch (error) {
          continue;
        }
      }

      return message.channel.send(fontList);
    }

    // Check if first argument is a font name
    const availableFonts = figlet.fontsSync();
    let font = "Standard";
    let text = input;

    const parts = input.split(" ");
    if (parts.length > 1 && availableFonts.includes(parts[0])) {
      font = parts[0];
      text = parts.slice(1).join(" ");
    }

    try {
      const asciiText = figlet.textSync(text, { font: font });

      if (asciiText.length > 1990) {
        return message.channel.send(
          "❌ ASCII art is too long! Try shorter text or a different font."
        );
      }

      await message.channel.send(`\`\`\`${asciiText}\`\`\``);
    } catch (error) {
      await message.channel.send(
        `⚠️ Error creating ASCII art. Try a different font or shorter text.\nUse \`${client.prefix}ascii fonts\` to see available fonts.`
      );
    }
  },
};
