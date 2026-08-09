import { loadConfig } from "../../utils/functions.js";

export default {
  name: "sol",
  aliases: ["solana", "soladdress"],
  description: "Display configured Solana address",
  usage: "sol",
  category: "general",
  type: "both",
  permissions: ["SendMessages"],
  cooldown: 3,

  async execute(client, message, args) {
    try {
      const config = loadConfig();

      // Check if crypto section exists in config
      if (!config.crypto) {
        return message.channel.send(
          "❌ **Crypto configuration not found!**\n" +
            "Please add a `crypto` section to your config.yaml file."
        );
      }

      const solAddress = config.crypto.sol;

      if (
        !solAddress ||
        solAddress.trim() === "" ||
        solAddress === "SOL_address_here"
      ) {
        return message.channel.send(
          "❌ **Solana address not configured!**\n" +
            "Please set your SOL address in the config.yaml file:\n" +
            "```yaml\n" +
            "crypto:\n" +
            '  sol: "your_solana_address_here"\n' +
            "```"
        );
      }

      // Display the SOL address with nice formatting
      const response =
        `◎ **Solana Address:**\n` +
        `\`\`\`${solAddress}\`\`\`\n` +
        `**Network:** Solana (SOL)\n` +
        `**Type:** Cryptocurrency Address\n\n` +
        `*Copy the address above to send Solana*`;

      await message.channel.send(response);
    } catch (error) {
      console.error("SOL command error:", error);
      await message.channel.send(
        "❌ **Error loading Solana address!**\n" +
          "Please check your configuration file."
      );
    }
  },
};
