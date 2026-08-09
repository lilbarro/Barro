import { getImage } from "./nsfw.js";

export default {
  name: "pussy",
  description: "Get a random pussy pic",
  aliases: ["vagina", "cooch"],
  usage: "pussy",
  category: "nsfw",
  type: "both",
  permissions: ["SendMessages"],
  cooldown: 3,

  async execute(client, message, args) {
    try {
      // Fetch the image
      const result = await getImage("pussy");

      if (result) {
        await message.channel.send(result);
      } else {
        await message.channel.send(
          "Sorry, couldn't fetch the image. Please try again."
        );
      }
    } catch (error) {
      console.error(`Error in pussy command: ${error}`);
      await message.channel.send(
        "Sorry, couldn't fetch the image. Please try again."
      );
    }
  },
};
