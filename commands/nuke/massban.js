import { codeBlock } from "../../utils/functions.js";

export default {
  name: "massban",
  aliases: ["mbans"],
  category: "nuke",
  ownerOnly: true,
  description: "Ban multiple server users",
  async execute(client, message, args) {
    if (args[0] && ["help", "--help", "-h"].includes(args[0].toLowerCase())) {
      return message.channel.send(`> **Massban Help**\n> Usage: \`${client.prefix}massban <user_id> [user_id ...]\`\n> Aliases: \`${client.prefix}mbans\``);
    }

    if (!args.length) {
      return message.channel.send("> ❌ **Please provide a list of User IDs to ban, separated by spaces.**");
    }

    const userIds = args;
    let successCount = 0;
    let failureCount = 0;
    const errors = [];

    await message.channel.send(`> ⏳ **Attempting to ban ${userIds.length} users...**`);

    for (const id of userIds) {
      try {
        const member = await message.guild.members.fetch(id).catch(() => null);
        if (!member) {
          errors.push(`User \`${id}\` not found in server.`);
          failureCount++;
          continue;
        }

        await member.ban({ reason: "Mass ban by owner" });
        successCount++;
      } catch (error) {
        errors.push(`Failed to ban \`${id}\`: ${error.message}`);
        failureCount++;
      }
    }

    const resultMessage = [
      `> ✅ **Mass Ban Completed**`,
      `> 🟢 **Successfully banned:** \`${successCount}\``,
      `> 🔴 **Failed to ban:** \`${failureCount}\``
    ].join("\n");

    if (errors.length > 0) {
      const errorLog = errors.join("\n");
      return message.channel.send(`${resultMessage}\n\n${codeBlock(errorLog, "text")}`);
    }

    return message.channel.send(resultMessage);
  },
};
