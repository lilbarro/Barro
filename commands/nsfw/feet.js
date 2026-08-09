import { getImage } from "./nsfw.js";

export default {
  name: "feet",
  description: "Get a random feet pic",
  aliases: ["foot", "footfetish"],
  usage: "feet",
  category: "nsfw",
  type: "both",
  permissions: ["SendMessages"],
  cooldown: 3,

  async execute(client, message, args) {
    try {
      // Fetch the image
      const result = await getImage("feet");

      if (result) {
        await message.channel.send(result);
      } else {
        await message.channel.send(
          "Sorry, couldn't fetch the image. Please try again."
        );
      }
    } catch (error) {
      console.error(`Error in feet command: ${error}`);
      await message.channel.send(
        "Sorry, couldn't fetch the image. Please try again."
      );
    }
  },
};
