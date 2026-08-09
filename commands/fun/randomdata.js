import axios from "axios";

export default {
  name: "randomdata",
  aliases: ["random", "rdata", "rd"],
  description: "Generate various types of random data",
  usage: "randomdata <type> [options]",
  category: "fun",
  cooldown: 3,

  async execute(client, message, args) {
    const type = args[0]?.toLowerCase();

    if (!type) {
      const helpText = `🎲 **Random Data Generator**
Available data types:
• \`user\` - Random user profile
• \`address\` - Random address
• \`bank\` - Random bank details
• \`card\` - Random credit card
• \`company\` - Random company details
• \`device\` - Random device info
• \`food\` - Random food item
• \`ipv4\` - Random IPv4 address
• \`ipv6\` - Random IPv6 address
• \`phone\` - Random phone number
• \`vehicle\` - Random vehicle info
• \`blood\` - Random blood type info
• \`commerce\` - Random product info

Use: \`${client.prefix}randomdata <type>\` to generate random data
Example: \`${client.prefix}randomdata user\``;

      return message.channel.send(helpText);
    }

    const baseUrl = "https://random-data-api.com/api/v2";
    const endpoints = {
      user: "users",
      address: "addresses",
      bank: "banks",
      card: "credit_cards",
      company: "companies",
      device: "devices",
      food: "foods",
      phone: "phones",
      vehicle: "vehicles",
      blood: "blood_types",
      commerce: "commerce",
    };

    const endpoint = endpoints[type];
    if (!endpoint) {
      return message.channel.send(
        `❌ Invalid data type! Use \`${client.prefix}randomdata\` to see available types.`
      );
    }

    try {
      const response = await axios.get(`${baseUrl}/${endpoint}`);
      const data = response.data;

      // Format the data nicely
      const formatted = this.formatData(data);
      const emoji = this.getEmoji(type);

      await message.channel.send(
        `${emoji} **Random ${
          type.charAt(0).toUpperCase() + type.slice(1)
        }:**\n${formatted}`
      );
    } catch (error) {
      // Handle special cases
      if (type === "ipv4" || type === "ipv6") {
        try {
          const response = await axios.get(`${baseUrl}/addresses`);
          const data = response.data;
          const ip = type === "ipv4" ? data.ip_v4_address : data.ip_v6_address;
          await message.channel.send(
            `🌐 **Random ${type.toUpperCase()}:** \`${ip}\``
          );
        } catch (err) {
          await message.channel.send(
            `❌ Failed to generate random ${type} data`
          );
        }
      } else {
        await message.channel.send(`❌ Failed to generate random ${type} data`);
      }
    }
  },

  formatData(data) {
    const result = [];
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === "object" && value !== null) {
        const nested = this.formatData(value);
        result.push(
          `**${key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase())}:**\n${nested}`
        );
      } else if (Array.isArray(value)) {
        const items = value.join(", ");
        result.push(
          `**${key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase())}:** ${items}`
        );
      } else {
        result.push(
          `**${key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase())}:** ${value}`
        );
      }
    }
    return result.join("\n");
  },

  getEmoji(type) {
    const emojis = {
      user: "👤",
      address: "📍",
      bank: "🏦",
      card: "💳",
      company: "🏢",
      device: "📱",
      food: "🍔",
      ipv4: "🌐",
      ipv6: "🌐",
      phone: "📞",
      vehicle: "🚗",
      blood: "🩸",
      commerce: "🛍️",
    };
    return emojis[type] || "🎲";
  },
};
