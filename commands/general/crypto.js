import axios from "axios";

export default {
  name: "latestcrypto",
  aliases: ["price", "cryptoprice", "cryptoinfo", "crypto"],
  description: "Get latest cryptocurrency price info",
  usage: "latestcrypto <currency>",
  category: "general",
  type: "both",
  permissions: ["SendMessages"],
  cooldown: 5,

  async execute(client, message, args) {
    const currency = args[0];

    if (!currency) {
      return message.channel.send(
        "❌ Please provide a cryptocurrency name!\n" +
          `**Usage:** \`${client.prefix}crypto <currency>\`\n` +
          "**Examples:**\n" +
          `• \`${client.prefix}crypto bitcoin\`\n` +
          `• \`${client.prefix}crypto ethereum\`\n` +
          `• \`${client.prefix}crypto litecoin\`\n` +
          `• \`${client.prefix}crypto solana\``
      );
    }

    const statusMsg = await message.channel.send(
      `🔍 **Fetching ${currency} data...**`
    );

    try {
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${currency.toLowerCase()}`,
        {
          timeout: 10000,
        }
      );

      if (response.status === 200) {
        const data = response.data;

        // Format the price change with appropriate emoji
        const priceChange = data.market_data.price_change_percentage_24h;
        const changeEmoji = priceChange >= 0 ? "📈" : "📉";
        const changeColor = priceChange >= 0 ? "+" : "";

        const info = {
          Name: data.name,
          Symbol: data.symbol.toUpperCase(),
          "Current Price": `$${data.market_data.current_price.usd.toLocaleString(
            "en-US",
            { minimumFractionDigits: 2, maximumFractionDigits: 8 }
          )}`,
          "24h High": `$${data.market_data.high_24h.usd.toLocaleString(
            "en-US",
            { minimumFractionDigits: 2, maximumFractionDigits: 8 }
          )}`,
          "24h Low": `$${data.market_data.low_24h.usd.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 8,
          })}`,
          "24h Change": `${changeEmoji} ${changeColor}${priceChange.toFixed(
            2
          )}%`,
          "Market Cap": `$${data.market_data.market_cap.usd.toLocaleString(
            "en-US"
          )}`,
          "Market Rank": `#${data.market_cap_rank || "N/A"}`,
          "Total Volume": `$${data.market_data.total_volume.usd.toLocaleString(
            "en-US"
          )}`,
        };

        let output = "**🪙 Crypto Information:**\n";
        for (const [key, value] of Object.entries(info)) {
          output += `**${key}:** ${value}\n`;
        }

        // Add last updated info
        const lastUpdated = new Date(data.last_updated).toLocaleString();
        output += `\n*Last updated: ${lastUpdated}*`;
        output += `\n*Data provided by CoinGecko*`;

        await statusMsg.edit(output);
      } else {
        await statusMsg.edit("❌ Cryptocurrency not found!");
      }
    } catch (error) {
      console.error("Crypto API error:", error);

      let errorMessage = "❌ **Failed to fetch crypto data!**\n";

      if (error.response?.status === 404) {
        errorMessage +=
          "**Reason:** Cryptocurrency not found. Please check the spelling.\n\n";
        errorMessage += "**Popular cryptocurrencies:**\n";
        errorMessage += "• bitcoin, ethereum, litecoin, solana\n";
        errorMessage += "• cardano, polkadot, chainlink, dogecoin\n";
        errorMessage += "• binancecoin, ripple, avalanche-2";
      } else if (error.response?.status === 429) {
        errorMessage +=
          "**Reason:** Rate limit exceeded. Please wait a moment and try again.";
      } else if (error.code === "ECONNABORTED") {
        errorMessage += "**Reason:** Request timed out. The API might be busy.";
      } else {
        errorMessage += `**Reason:** ${
          error.message || "Unknown error occurred"
        }`;
      }

      await statusMsg.edit(errorMessage);
    }
  },
};
