import { log } from "../../utils/functions.js";
import axios from "axios";
import TaskManager from "../../utils/TaskManager.js";
import RateLimitManager from "../../utils/RateLimitManager.js";

export default {
  name: "steal",
  description:
    "Steal one or more emojis (animated/static) from another server.",
  aliases: ["stealemoji"],
  usage: "<emoji1> <emoji2> ...",
  category: "misc",
  type: "server_only",
  permissions: ["ManageEmojisAndStickers"], // Verified as a valid flag
  cooldown: 5,

  execute: async (client, message, args) => {
    if (!args.length) {
      return message.channel.send(
        "> ❌ Please provide at least one emoji to steal."
      );
    }

    const guildId = message.guild.id;

    // Ensure only one task runs per server using TaskManager
    if (TaskManager.hasTask("steal", guildId)) {
      return message.channel.send(
        "> ⚠️ Another emoji stealing task is already running for this server."
      );
    }

    const task = TaskManager.createTask("steal", guildId);
    if (!task) {
      return message.channel.send("> ❌ Failed to create steal task.");
    }

    try {
      const emojisToSteal = [];
      const invalidEmojis = [];
      let isCancelled = false;
      let stolenCount = 0;

      // Parse all provided emoji arguments
      for (const arg of args) {
        const match = arg.match(/<a?:(\w+):(\d+)>/);
        if (!match) {
          invalidEmojis.push(arg);
          continue;
        }

        const [, name, emojiId] = match;
        const isAnimated = arg.startsWith("<a:");
        emojisToSteal.push({ id: emojiId, name, isAnimated });
      }

      if (invalidEmojis.length > 0) {
        message.channel.send(
          `> ❌ Invalid emoji format: ${invalidEmojis.join(", ")}`
        );
      }

      if (emojisToSteal.length === 0) {
        return; // Exit early if no valid emojis were found
      }

      // Create status message
      const statusMsg = await message.channel.send(
        `> ⏳ Stealing ${emojisToSteal.length} emojis...`
      );

      // Add cancellation listener
      if (task.signal) {
        task.signal.addEventListener("abort", () => {
          isCancelled = true;
          // Only show cancellation message if it wasn't a natural completion
          if (!task.signal.reason || task.signal.reason !== "completed") {
            statusMsg
              .edit(
                `> ⚠️ Emoji steal task cancelled after stealing ${stolenCount} emojis.`
              )
              .catch(() => {});
          }
        });
      }

      const rateLimiter = new RateLimitManager(5, 5000); // Allow 5 requests every 5 seconds

      for (const { id, name, isAnimated } of emojisToSteal) {
        if (task.signal.aborted) break;

        await rateLimiter.execute(async () => {
          if (task.signal.aborted) return;
          try {
            const extension = isAnimated ? "gif" : "png";
            const response = await axios.get(
              `https://cdn.discordapp.com/emojis/${id}.${extension}`,
              { responseType: "arraybuffer" }
            );

            if (response.status !== 200)
              throw new Error("Failed to fetch emoji.");

            const buffer = Buffer.from(response.data);
            const addedEmoji = await message.guild.emojis.create(buffer, name, {
              reason: "Emoji stolen via selfbot",
            });
            stolenCount++;
            message.channel.send(
              `> ✅ Successfully stole emoji: ${addedEmoji}`
            );
          } catch (error) {
            if (task.signal.aborted || error.message.includes("cancelled"))
              return;
            log(`Error stealing emoji ID ${id}: ${error.message}`, "error");
            message.channel.send(
              `> ❌ Failed to steal emoji ID ${id}: ${error.message}`
            );
          }
        }, task.signal);
      }

      if (!isCancelled) {
        statusMsg
          .edit(
            `> ✅ Successfully stole ${stolenCount}/${emojisToSteal.length} emojis.`
          )
          .catch(() => {});
      }
    } finally {
      task.stop();
    }
  },
};
