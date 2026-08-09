import { getImage } from "./nsfw.js";

export default {
  name: "porn",
  description: "Get a random porn gif",
  aliases: ["pgif", "porngif"],
  usage: "porn",
  category: "nsfw",
  type: "both",
  permissions: ["SendMessages"],
  cooldown: 3,

  async execute(client, message, args) {
    try {
      // Fetch the image
      const result = await getImage("pgif");

      if (result) {
        await message.channel.send(result);
      } else {
        await message.channel.send(
          "Sorry, couldn't fetch the image. Please try again."
        );
      }
    } catch (error) {
      console.error(`Error in porn command: ${error}`);
      await message.channel.send(
        "Sorry, couldn't fetch the image. Please try again."
      );
    }
  },
};
