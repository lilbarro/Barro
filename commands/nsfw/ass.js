import { getImage } from "./nsfw.js";

export default {
  name: "ass",
  description: "Get a random ass pic",
  aliases: ["butt", "booty"],
  usage: "ass",
  category: "nsfw",
  type: "both",
  permissions: ["SendMessages"],
  cooldown: 3,

  async execute(client, message, args) {
    try {
      // Fetch the image
      const result = await getImage("ass");

      if (result) {
        await message.channel.send(result);
      } else {
        await message.channel.send(
          "Sorry, couldn't fetch the image. Please try again."
        );
      }
    } catch (error) {
      console.error(`Error in ass command: ${error}`);
      await message.channel.send(
        "Sorry, couldn't fetch the image. Please try again."
      );
    }
  },
};
