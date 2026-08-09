import { getImage } from "./nsfw.js";

export default {
  name: "hentai",
  description: "Get random hentai images",
  aliases: ["lewd", "ecchi"],
  usage: "hentai",
  category: "nsfw",
  type: "both",
  permissions: ["SendMessages"],
  cooldown: 3,

  async execute(client, message, args) {
    try {
      // Array of hentai image types
      const types = ["hentai", "hass", "hboobs", "hmidriff", "hthigh", "hanal"];

      // Get a random type from the array
      const randomType = types[Math.floor(Math.random() * types.length)];

      // Fetch the image
      const result = await getImage(randomType);

      if (result) {
        await message.channel.send(result);
      } else {
        await message.channel.send(
          "Sorry, couldn't fetch the image. Please try again."
        );
      }
    } catch (error) {
      console.error(`Error in hentai command: ${error}`);
      await message.channel.send(
        "Sorry, couldn't fetch the image. Please try again."
      );
    }
  },
};
