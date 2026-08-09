import { log } from "../../utils/functions.js";

export default {
  name: "leave",
  description: "Leave the current server immediately.",
  aliases: ["exit", "leaveserver", "exitserver"],
  usage: "",
  category: "server",
  type: "server_only",
  permissions: ["SendMessages"],
  cooldown: 5,

  execute: async (client, message, args) => {
    try {
      if (!message.guild) {
        return message.channel.send(
          "> ❌ This command can only be used in servers."
        );
      }

      if (message.author.id !== client.user.id) return;

      const guildName = message.guild.name;
      const guildId = message.guild.id;

      try {
        // Send confirmation message before leaving
        await message.channel.send(
          formatAnsiBlock([`👋 ${style("Leaving server:", "1;30")} ${guildName}...`])
        );

        // Small delay to ensure the message is sent before leaving
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Leave the server
        await message.guild.leave();

        // Log the action
        log(`Successfully left guild ${guildName} (${guildId})`, "debug");

        // No need for a follow-up message since we've already left the server
      } catch (error) {
        log(
          `Failed to leave guild ${guildName} (${guildId}): ${error.message}`,
          "error"
        );

        // Try to send an error message if possible
        try {
          message.channel.send(
            "> ❌ Failed to leave the server. Check console for details."
          );
        } catch {
          // If we can't send a message, just log it
          log("Could not send error message to channel", "warn");
        }
      }
    } catch (error) {
      console.error(error);
      message.channel.send("> ❌ An unexpected error occurred.");
    }
  },
};

function style(text, colorCode) {
  return `\u001b[${colorCode}m${text}\u001b[0m`;
}

function formatAnsiBlock(lines) {
  return ["> ```ansi", ...lines.map((line) => `> ${line}`), "> ```"].join("\n");
}
