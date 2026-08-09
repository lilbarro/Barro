import { log } from "../../utils/functions.js";

export default {
  name: "servericon",
  description: "Change the icon of the current server.",
  aliases: ["changeicon", "seticon", "guildicon"],
  usage: "<image_url>",
  category: "server",
  type: "server_only",
  permissions: ["ManageGuild"],
  cooldown: 5,

  execute: async (client, message, args) => {
    try {
      if (!message.guild) {
        return message.channel.send(
          "> ❌ This command can only be used in servers."
        );
      }

      if (message.author.id !== client.user.id) return;

      // Check if an image URL was provided
      const iconURL = args[0];
      if (!iconURL) {
        return message.channel.send(
          "> ❌ Please provide an image URL for the server icon."
        );
      }

      try {
        // Change the server icon
        await message.guild.setIcon(iconURL, "Icon changed via selfbot");

        // Send success message
        message.channel.send(`> ✅ Server icon changed successfully!`);

        // Log the action
        log(
          `Changed server icon in guild ${message.guild.name} (${message.guild.id})`,
          "debug"
        );
      } catch (error) {
        log(`Failed to change server icon: ${error.message}`, "error");
        message.channel.send(
          "> ❌ Failed to change the server icon. Make sure the URL is valid and accessible."
        );
      }
    } catch (error) {
      console.error(error);
      message.channel.send("> ❌ An unexpected error occurred.");
    }
  },
};
