export default {
  name: "noprefix",
  description: "Toggle command execution without prefix (In-memory only)",
  category: "settings",
  ownerOnly: true,
  aliases: ["prefixless"],
  async execute(client, message, args) {
    if (!args[0]) {
      return message.channel.send(`> ℹ️ **Status:** No-prefix mode is currently **${client.noprefix ? "ENABLED" : "DISABLED"}**. Use \`noprefix enable/disable\` to change it.`);
    }

    const action = args[0].toLowerCase();

    if (action === "enable" || action === "on") {
      client.noprefix = true;
      message.channel.send("> ✅ **Success:** No-prefix mode has been **ENABLED**. You can now use commands without the prefix until the next restart.");
    } else if (action === "disable" || action === "off") {
      client.noprefix = false;
      message.channel.send("> ✅ **Success:** No-prefix mode has been **DISABLED**.");
    } else {
      message.channel.send("> ❌ **Error:** Invalid action. Use \`enable\` or \`disable\`.");
    }
  },
};
