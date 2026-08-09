import { getImage } from "./nsfw.js";

export default {
  name: "neko",
  description: "Get a random neko image",
  aliases: ["catgirl", "nekos"],
  usage: "neko",
  category: "nsfw",
  type: "both",
  permissions: ["SendMessages"],
  cooldown: 3,

  async execute(client, message, args) {
    try {
      // Fetch the image
      const result = await getImage("neko");

      if (result) {
        await message.channel.send(result);
      } else {
        await message.channel.send(
          "Sorry, couldn't fetch the image. Please try again."
        );
      }
    } catch (error) {
      console.error(`Error in neko command: ${error}`);
      await message.channel.send(
        "Sorry, couldn't fetch the image. Please try again."
      );
    }
  },
};
