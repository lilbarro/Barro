import { codeBlock } from "../../utils/functions.js";

export default {
  name: "nuke",
  aliases: ["crush"],
  category: "nuke",
  ownerOnly: true,
  description: "Reset server channels",
  async execute(client, message, args) {
    if (args[0] && ["help", "--help", "-h"].includes(args[0].toLowerCase())) {
      return message.channel.send(`> **Nuke Help**\n> Usage: \`${client.prefix}nuke\`\n> Aliases: \`${client.prefix}crush\`\n> Deletes server channels and creates a replacement channel.`);
    }

    try {
      const guild = message.guild;
      if (!guild) return;

      // 1. Get all channels
      const channels = await guild.channels.fetch();
      
      // 2. Delete all channels
      // We use Promise.allSettled to ensure we try to delete every channel 
      // even if some fail (e.g. category permissions or system channels)
      await Promise.allSettled(channels.map(channel => channel.delete().catch(err => null)));

      // 3. Create the nuke channel
      const newChannel = await guild.channels.create("crushed by Barro v2", {
        type: 0, // 0 is GuildText
      });

      // 4. Ping @everyone
      await newChannel.send("@everyone\n**This server has been crushed by Barro v2**");

    } catch (error) {
      console.error(`Nuke Error: ${error.message}`);
      // Since all channels are likely gone, we can't send a message back to the original channel
      // but we can try to send it to the new channel if it was created
    }
  },
};
