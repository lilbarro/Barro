import axios from "axios";
import { log } from "../../utils/functions.js";

// Main NSFW command that shows all available NSFW commands
export default {
  name: "nsfw",
  description: "NSFW commands category",
  aliases: ["notsafeforwork", "18+"],
  usage: "nsfw",
  category: "nsfw",
  type: "both",
  permissions: ["SendMessages"],
  cooldown: 3,

  async execute(client, message, args) {
    try {
      // Get all NSFW commands except this one
      const nsfwCommands = Array.from(client.commands.values()).filter(
        (cmd) => cmd.category === "nsfw" && cmd.name !== "nsfw"
      );

      // Format the commands list
      const commandText = nsfwCommands.map((cmd) => `• ${cmd.name}`).join("\n");

      await message.channel.send(`🔞 **NSFW Commands**\n\n${commandText}`);
    } catch (error) {
      log(`Error showing NSFW commands: ${error.message}`, "error");
      await message.channel.send(
        "Error displaying commands menu. Try again later."
      );
    }
  },
};

// Helper function to fetch images from the API
export async function getImage(type) {
  try {
    const apiBase = "https://nekobot.xyz/api/image";
    const response = await axios.get(`${apiBase}?type=${type}`);

    if (response.status === 200) {
      return response.data.message;
    }
    return null;
  } catch (error) {
    log(`Error fetching image: ${error.message}`, "error");
    return null;
  }
}
