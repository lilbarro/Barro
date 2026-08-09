import { getImage } from "./nsfw.js";

export default {
  name: "thigh",
  description: "Get a random thigh pic",
  aliases: ["thighs", "legs"],
  usage: "thigh",
  category: "nsfw",
  type: "both",
  permissions: ["SendMessages"],
  cooldown: 3,
  
  async execute(client, message, args) {
    try {
      // Fetch the image
      const result = await getImage("thigh");

      if (result) {
        await message.channel.send(result);
      } else {
        await message.channel.send(
          "Sorry, couldn't fetch the image. Please try again."
        );
      }
    } catch (error) {
      console.error(`Error in thigh command: ${error}`);
      await message.channel.send(
        "Sorry, couldn't fetch the image. Please try again."
      );
    }
  },
};
