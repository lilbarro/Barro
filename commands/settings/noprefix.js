import { style, formatAnsiBlock } from "../../utils/functions.js";
import { THEME } from "../../utils/theme.js";

export default {
  name: "noprefix",
  description: "Toggle prefixless commands",
  category: "settings",
  ownerOnly: true,
  aliases: ["prefixless"],
  async execute(client, message, args) {
    if (!args[0]) {
      return message.channel.send(
        formatAnsiBlock([
          style(`Barro`, THEME.HEADER_BOLD_COLOR) + style(` Settings | NoPrefix`, THEME.ACCENT_COLOR),
          style(`Status: `, THEME.LABEL_COLOR) + style(`${client.noprefix ? "ENABLED" : "DISABLED"}`, THEME.ACCENT_COLOR),
          style(`Usage: `, THEME.LABEL_COLOR) + style(`\`${client.prefix}noprefix enable/disable\``, THEME.ACCENT_COLOR)
        ])
      );
    }

    const action = args[0].toLowerCase();

    if (action === "enable" || action === "on") {
      client.noprefix = true;
      message.channel.send(
        formatAnsiBlock([
          style(`Barro`, THEME.HEADER_BOLD_COLOR) + style(` Settings | NoPrefix`, THEME.ACCENT_COLOR),
          style(`✅ No-prefix mode has been ENABLED.`, THEME.ACCENT_COLOR)
        ])
      );
    } else if (action === "disable" || action === "off") {
      client.noprefix = false;
      message.channel.send(
        formatAnsiBlock([
          style(`Barro`, THEME.HEADER_BOLD_COLOR) + style(` Settings | NoPrefix`, THEME.ACCENT_COLOR),
          style(`✅ No-prefix mode has been DISABLED.`, THEME.ACCENT_COLOR)
        ])
      );
    } else {
      message.channel.send(
        formatAnsiBlock([
          style(`Barro`, THEME.HEADER_BOLD_COLOR) + style(` Settings | NoPrefix`, THEME.ACCENT_COLOR),
          style(`❌ Invalid action. Use \`enable\` or \`disable\`.`, THEME.LABEL_COLOR)
        ])
      );
    }
  },
};
