import { codeBlock } from "../../utils/functions.js";

export default {
  name: "ban100",
  aliases: ["ban100m"],
  category: "nuke",
  ownerOnly: true,
  description: "Ban eligible members",
  async execute(client, message, args) {
    if (args[0] && ["help", "--help", "-h"].includes(args[0].toLowerCase())) {
      return message.channel.send(`> **Ban100 Help**\n> Usage: \`${client.prefix}ban100\`\n> Aliases: \`${client.prefix}ban100m\`\n> Bans up to 100 eligible members.`);
    }

    try {
      const members = await message.guild.members.fetch();
      const botMember = await message.guild.members.fetch(client.user.id);
      
      const targetMembers = members.filter(member => 
        member.id !== client.user.id && 
        member.bannable && 
        member.roles.highest.position < botMember.roles.highest.position
      );

      if (targetMembers.size === 0) {
        return message.channel.send("> ❌ **No bannable members found with a lower role than the bot.**");
      }

      // Convert collection to array and slice first 100
      const list = Array.from(targetMembers.values()).slice(0, 100);
      
      await message.channel.send(`> ⏳ **Attempting to ban ${list.length} members...**`);

      let successCount = 0;
      let failureCount = 0;

      for (const member of list) {
        try {
          await member.ban({ reason: "Mass ban 100 by owner" });
          successCount++;
        } catch (error) {
          failureCount++;
        }
      }

      return message.channel.send(`> ✅ **Mass Ban 100 Completed**\n> 🟢 **Successfully banned:** \`${successCount}\`\n> 🔴 **Failed to ban:** \`${failureCount}\``);
    } catch (error) {
      return message.channel.send(`> ❌ **Error:** ${error.message}`);
    }
  },
};
