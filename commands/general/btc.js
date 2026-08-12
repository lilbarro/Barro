import { loadConfig } from "../../utils/functions.js";

export default {
  name: "btc",
  aliases: ["bitcoin", "btcaddress"],
  description: "Display configured Bitcoin address",
  usage: "btc",
  category: "general",
  type: "both",
  permissions: ["SendMessages"],
  cooldown: 10,

  async execute(client, message, args) {
    try {
      const config = loadConfig();

      // Check if crypto section exists in config
      if (!config.crypto) {
        return message.channel.send(formatAnsiBlock([
          style('[ BTC ]', '1;30'),
          '',
          style('ERROR:', '1;31') + ' ' + style('Crypto configuration not found!', '0;97'),
          style('INFO:', '1;31') + ' ' + style('Please add a crypto section to your config.yaml file.', '0;97')
        ]));
      }

      const btcAddress = config.crypto.btc;

      if (
        !btcAddress ||
        btcAddress.trim() === "" ||
        btcAddress === "BTC_address_here"
      ) {
        return message.channel.send(formatAnsiBlock([
          style('[ BTC ]', '1;30'),
          '',
          style('ERROR:', '1;31') + ' ' + style('Bitcoin address not configured!', '0;97'),
          style('INFO:', '1;31') + ' ' + style('Please set your BTC address in config.yaml:', '0;97'),
          'crypto:',
          '  btc: your_bitcoin_address_here'
        ]));
      }

      // Display the BTC address with nice formatting
      const response =
        `₿ **Bitcoin Address:**\n` +
        `\`\`\`${btcAddress}\`\`\`\n` +
        `**Network:** Bitcoin (BTC)\n` +
        `**Type:** Cryptocurrency Address\n\n` +
        `*Copy the address above to send Bitcoin*`;

      await message.channel.send(response);
    } catch (error) {
      console.error("BTC command error:", error);
      await message.channel.send(formatAnsiBlock([
        style('[ BTC ]', '1;30'),
        '',
        style('ERROR:', '1;31') + ' ' + style('Error loading Bitcoin address!', '0;97'),
        style('INFO:', '1;31') + ' ' + style('Please check your configuration file.', '0;97')
      ]));
    }
  },
};

function style(text, colorCode) {
  return `\u001b[${colorCode}m${text}\u001b[0m`;
}

function formatAnsiBlock(lines) {
  return ['> ```ansi', ...lines.map(line => `> ${line}`), '> ```'].join('\n');
}
