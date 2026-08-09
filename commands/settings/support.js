import { log } from "../../utils/functions.js";

export default {
  name: "support",
  description: "Get support links and developer contact information",
  aliases: ["contact", "dev"],
  usage: "",
  category: "settings",
  type: "both",
  permissions: ["SendMessages"],
  cooldown: 5,

  async execute(client, message, args) {
    try {
      const supportMessage = [
        "> ## 🛠️ **Barro Selfbot Support**",
        "> ",
        "> ### 📋 **GitHub Repository**",
        "> **Issues & Bug Reports:** https://github.com/lilbarro/Barro",
        "> Report bugs, request features, or contribute to the project",
        "> ",
        "> ### 💬 **Support Server**",
        "> **Discord Server:** https://discord.gg/b3hZG4R7Mf",
        "> Join our community for help, updates, and discussions",
        "> ",
        "> ### 👨‍💻 **Developers**",
        "> **Main Developer:** `lilbarro`",
        "> **Co-Developer:** `None`",
        "> ",
        "> Feel free to DM me directly for support or questions!",
        "> ",
        "> ### ⚠️ **Important Notice**",
        "> Selfbots violate Discord's Terms of Service",
        "> Use at your own risk - accounts may be terminated if not used correctly.",
      ].join("\n");

      await message.channel.send(supportMessage);

      log(`Support command used by ${message.author.tag}`, "debug");
    } catch (error) {
      log(`Error in support command: ${error.message}`, "error");
      message.channel.send(`> ❌ An error occurred: ${error.message}`);
    }
  },
};