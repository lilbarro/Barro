import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { log, loadConfig } from "../../utils/functions.js";
import https from "https";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "backup",
  description: "Create a backup of selfbot data (friends, servers, etc.)",
  aliases: ["createbackup", "save"],
  usage: "backup [backup_name]",
  category: "settings",
  type: "both",
  ownerOnly: true,
  permissions: ["SendMessages"],
  cooldown: 30,

  async execute(client, message, args) {
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
          style(`Barro`, `4;30`) + style(` Backup | Initializing...`, '0;34')
        ])
      );

      // ... existing code ...

      await statusMsg.edit(
        formatAnsiBlock([
          style(`Barro`, `4;30`) + style(` Backup | Collecting data`, '0;34'),
          style(`Status: `, '0;97') + style(`Collecting friends...`, '0;34')
        ])
      );

      // ... existing code ...

      await statusMsg.edit(
        formatAnsiBlock([
          style(`Barro`, `4;30`) + style(` Backup | Collecting data`, '0;34'),
          style(`Status: `, '0;97') + style(`Friends collected.`, '0;32'),
          style(`Action: `, '0;97') + style(`Collecting servers...`, '0;34')
        ])
      );

      // ... existing code ...

      await statusMsg.edit(
        formatAnsiBlock([
          style(`Barro`, `4;30`) + style(` Backup | Saving data`, '0;34'),
          style(`Status: `, '0;97') + style(`Servers collected.`, '0;32'),
          style(`Action: `, '0;97') + style(`Writing to file...`, '0;34')
        ])
      );

      // Save backup to file
      const backupFilePath = path.join(backupDir, `${backupName}.json`);
      fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2));

      // Calculate file size
      const stats = fs.statSync(backupFilePath);
      const fileSizeKB = Math.round(stats.size / 1024);

      const block1 = formatAnsiBlock([
        style(`Barro`, `4;30`) + style(` Backup Success`, '0;32')
      ]);

      const block2 = formatAnsiBlock([
        style('Backup Statistics', '4;30'),
        kv('Name', backupName, 14),
        kv('Friends', backupData.statistics.total_friends, 14),
        kv('Servers', backupData.statistics.total_servers, 14),
        kv('Channels', backupData.statistics.total_channels, 14),
        kv('Size', `${fileSizeKB}KB`, 14)
      ]);

      const block3 = formatAnsiBlock([
        style('Location', '4;30'),
        style(`data/backups/${backupName}.json`, '0;34'),
        '',
        style('Usage:', '0;97') + ' ' + style(`${client.prefix}view ${backupName}`, '0;34')
      ]);

      await statusMsg.edit([block1, block2, block3].join('\n'));

      log(
        `Backup created: ${backupName} - Friends: ${backupData.statistics.total_friends}, Servers: ${backupData.statistics.total_servers}`,
        "success"
      );
    } catch (error) {
      log(`Error creating backup: ${error.message}`, "error");
      await message.channel.send(formatAnsiBlock([
        style(`ERROR: Backup creation failed!`, '1;94'),
        style(error.message, '0;34')
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
  return style(padded, '0;97') + style(' | ', '0;30') + style(String(value), '0;34');
}

