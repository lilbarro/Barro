import { log } from "../../utils/functions.js";

export default {
  name: "servername",
  description: "Change the name of the current server.",
  aliases: ["changename", "setname", "guildname"],
  usage: "<new_name>",
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

      // Check if a new name was provided
      const newName = args.join(" ");
      if (!newName) {
        return message.channel.send("> ❌ Please provide a new server name.");
      }

      const oldName = message.guild.name;

      try {
        // Change the server name
        await message.guild.setName(newName, "Name changed via selfbot");

        // Send success message
        message.channel.send(
          `> ✅ Server name changed from **${oldName}** to **${newName}**`
        );

        // Log the action
        log(
          `Changed server name from "${oldName}" to "${newName}" in guild ${message.guild.id}`,
          "debug"
        );
      } catch (error) {
        log(`Failed to change server name: ${error.message}`, "error");
        message.channel.send(
          "> ❌ Failed to change the server name. Check console for details."
        );
      }
    } catch (error) {
      console.error(error);
      message.channel.send("> ❌ An unexpected error occurred.");
    }
  },
};
