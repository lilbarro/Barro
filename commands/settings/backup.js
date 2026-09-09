import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { log, loadConfig, formatAnsiBlocks } from "../../utils/functions.js";
import https from "https";
import { THEME } from "../../utils/theme.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "backup",
  description: "Back up account settings",
  aliases: ["createbackup", "save"],
  usage: "backup [backup_name]",
  category: "settings",
  type: "both",
  ownerOnly: true,
  permissions: ["SendMessages"],
  cooldown: 30,

  async execute(client, message, args) {
    if (args[0] && ["help", "--help", "-h"].includes(args[0].toLowerCase())) {
      return message.channel.send(`> **Backup Help**\n> Usage: \`${client.prefix}backup [backup_name]\`\n> Aliases: \`${client.prefix}createbackup\`, \`${client.prefix}save\`\n> Creates a backup with an optional name.`);
    }

    try {
      // Generate backup name
      const backupName = args[0] || `backup_${Date.now()}`;
      const backupDir = path.join(__dirname, "..", "..", "data", "backups");

      // Ensure backup directory exists
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

            const statusMsg = await message.channel.send(
        formatAnsiBlock([
          style(`Barro`, THEME.HEADER_BOLD_COLOR) + style(` Backup | Initializing...`, THEME.ACCENT_COLOR)
        ])
      );

      // ... existing code ...

      await statusMsg.edit(
        formatAnsiBlock([
          style(`Barro`, THEME.HEADER_BOLD_COLOR) + style(` Backup | Collecting data`, THEME.ACCENT_COLOR),
          style(`Status: `, THEME.LABEL_COLOR) + style(`Collecting friends...`, THEME.ACCENT_COLOR)
        ])
      );

      // ... existing code ...

      await statusMsg.edit(
        formatAnsiBlock([
          style(`Barro`, THEME.HEADER_BOLD_COLOR) + style(` Backup | Collecting data`, THEME.ACCENT_COLOR),
          style(`Status: `, THEME.LABEL_COLOR) + style(`Friends collected.`, '0;32'),
          style(`Action: `, THEME.LABEL_COLOR) + style(`Collecting servers...`, THEME.ACCENT_COLOR)
        ])
      );

      // ... existing code ...

      await statusMsg.edit(
        formatAnsiBlock([
          style(`Barro`, THEME.HEADER_BOLD_COLOR) + style(` Backup | Saving data`, THEME.ACCENT_COLOR),
          style(`Status: `, THEME.LABEL_COLOR) + style(`Servers collected.`, '0;32'),
          style(`Action: `, THEME.LABEL_COLOR) + style(`Writing to file...`, THEME.ACCENT_COLOR)
        ])
      );

      // Save backup to file
      const backupFilePath = path.join(backupDir, `${backupName}.json`);
      fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2));

      // Calculate file size
      const stats = fs.statSync(backupFilePath);
      const fileSizeKB = Math.round(stats.size / 1024);

      const block1 = formatAnsiBlock([
        style(`Barro`, THEME.HEADER_BOLD_COLOR) + style(` Backup Success`, THEME.ACCENT_COLOR)
      ]);

      const block2 = formatAnsiBlock([
        style('Backup Statistics', THEME.HEADER_BOLD_COLOR),
        kv('Name', backupName, 14),
        kv('Friends', backupData.statistics.total_friends, 14),
        kv('Servers', backupData.statistics.total_servers, 14),
        kv('Channels', backupData.statistics.total_channels, 14),
        kv('Size', `${fileSizeKB}KB`, 14)
      ]);

      const block3 = formatAnsiBlock([
        style('Location', THEME.HEADER_BOLD_COLOR),
        style(`data/backups/${backupName}.json`, THEME.ACCENT_COLOR),
        '',
        style('Usage:', THEME.LABEL_COLOR) + ' ' + style(`${client.prefix}view ${backupName}`, THEME.ACCENT_COLOR)
      ]);

      await statusMsg.edit(formatAnsiBlocks([block1, block2, block3]));

      log(
        `Backup created: ${backupName} - Friends: ${backupData.statistics.total_friends}, Servers: ${backupData.statistics.total_servers}`,
        "success"
      );
    } catch (error) {
      log(`Error creating backup: ${error.message}`, "error");
      await message.channel.send(formatAnsiBlock([
        style(`ERROR: Backup creation failed!`, THEME.ACCENT_COLOR),
        style(error.message, THEME.ACCENT_COLOR)
      ]));
    }
  },

  // Helper method to make API requests using native https module

  makeApiRequest(endpoint, token) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: "discord.com",
        path: endpoint,
        method: "GET",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      };

      const req = https.request(options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          if (res.statusCode === 200) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(new Error(`Failed to parse API response: ${e.message}`));
            }
          } else {
            reject(
              new Error(`API request failed with status code ${res.statusCode}`)
            );
          }
        });
      });

      req.on("error", (error) => {
        reject(error);
      });

      req.end();
      });
  },
};

function style(text, colorCode) {
  return `\u001b[${colorCode}m${text}\u001b[0m`;
}

function formatAnsiBlock(lines) {
  return ['> ```ansi', ...lines.map(line => `> ${line}`), '> ```'].join('\n');
}

function kv(label, value, padTo) {
  const padded = String(label).padEnd(padTo, ' ');
  return style(padded, THEME.LABEL_COLOR) + style(' | ', THEME.DIVIDER_COLOR) + style(String(value), THEME.ACCENT_COLOR);
}

