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
        "> 💾 **Creating backup...**"
      );

      // Collect selfbot data
      const backupData = {
        metadata: {
          created_at: new Date().toISOString(),
          backup_name: backupName,
          selfbot_user: {
            id: client.user.id,
            username: client.user.username,
            tag: client.user.tag,
            created_at: client.user.createdAt.toISOString(),
          },
        },
        friends: [],
        servers: [],
        statistics: {
          total_friends: 0,
          total_servers: 0,
          total_channels: 0,
        },
      };

      await statusMsg.edit(
        "> 💾 **Creating backup...**\n> 👥 Collecting friends data..."
      );

      // Collect friends data - try multiple methods
      try {
        // Method 1: Try to use client's REST API directly
        if (client.rest && typeof client.rest.get === "function") {
          try {
            const friendsData = await client.rest.get(
              "/users/@me/relationships"
            );

            if (friendsData && Array.isArray(friendsData)) {
              // Filter only friend relationships (type 1)
              const friends = friendsData.filter((rel) => rel.type === 1);

              for (const friend of friends) {
                const user = friend.user;
                if (user) {
                  backupData.friends.push({
                    id: user.id,
                    username: user.username,
                    tag: user.discriminator
                      ? `${user.username}#${user.discriminator}`
                      : user.username,
                    avatar: user.avatar
                      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
                      : null,
                    created_at: new Date(
                      parseInt(user.id) / 4194304 + 1420070400000
                    ).toISOString(),
                  });
                }
              }
            }
          } catch (restError) {
            log(`REST API method failed: ${restError.message}`, "debug");
            // Continue to next method if this fails
          }
        }

        // Method 2: Try to use client.user.friends
        if (backupData.friends.length === 0 && client.user.friends) {
          try {
            const friends = await client.user.friends.fetch();

            if (friends && friends.size > 0) {
              for (const [, user] of friends) {
                backupData.friends.push({
                  id: user.id,
                  username: user.username,
                  tag: user.tag || user.username,
                  avatar: user.displayAvatarURL({ dynamic: true }),
                  created_at:
                    user.createdAt?.toISOString() || new Date().toISOString(),
                });
              }
            }
          } catch (friendsError) {
            log(
              `Friends fetch method failed: ${friendsError.message}`,
              "debug"
            );
            // Continue to next method if this fails
          }
        }

        // Method 3: Try to use client.relationships
        if (
          backupData.friends.length === 0 &&
          client.relationships &&
          client.relationships.cache
        ) {
          try {
            for (const [, relationship] of client.relationships.cache) {
              if (relationship.type === 1) {
                // Friend relationship
                const user = relationship.user;
                if (user) {
                  backupData.friends.push({
                    id: user.id,
                    username: user.username,
                    tag: user.tag || user.username,
                    avatar: user.displayAvatarURL({ dynamic: true }),
                    created_at:
                      user.createdAt?.toISOString() || new Date().toISOString(),
                  });
                }
              }
            }
          } catch (relationshipsError) {
            log(
              `Relationships cache method failed: ${relationshipsError.message}`,
              "debug"
            );
            // Continue if this fails
          }
        }

        // Method 4: Fall back to using the HTTP API directly
        if (backupData.friends.length === 0) {
          try {
            // Get config for token
            const config = loadConfig();
            const token = client.token || config.selfbot.token;

            // Make a direct HTTP request
            const friendsData = await this.makeApiRequest(
              "/users/@me/relationships",
              token
            );

            if (friendsData && Array.isArray(friendsData)) {
              // Filter only friend relationships (type 1)
              const friends = friendsData.filter((rel) => rel.type === 1);

              for (const friend of friends) {
                const user = friend.user;
                if (user) {
                  backupData.friends.push({
                    id: user.id,
                    username: user.username,
                    tag: user.discriminator
                      ? `${user.username}#${user.discriminator}`
                      : user.username,
                    avatar: user.avatar
                      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
                      : null,
                    created_at: new Date(
                      parseInt(user.id) / 4194304 + 1420070400000
                    ).toISOString(),
                  });
                }
              }
            }
          } catch (httpError) {
            log(`Direct HTTP method failed: ${httpError.message}`, "debug");
            // This is our last resort, so we'll just have to accept 0 friends if this fails
          }
        }

        backupData.statistics.total_friends = backupData.friends.length;
      } catch (error) {
        log(`Error collecting friends data: ${error.message}`, "warn");
        backupData.friends = [];
      }

      await statusMsg.edit(
        "> 💾 **Creating backup...**\n> 👥 Collecting friends data... ✅\n> 🏠 Collecting servers data..."
      );

      // Collect servers data using Discord.js client (much faster)
      try {
        // Use client.guilds.cache which is already loaded
        for (const [, guild] of client.guilds.cache) {
          // Only collect basic information to keep the backup small and fast
          const serverData = {
            id: guild.id,
            name: guild.name,
            icon: guild.iconURL({ dynamic: true }),
            owner_id: guild.ownerId || "Unknown",
            member_count: guild.memberCount || "Unknown",
            created_at:
              guild.createdAt?.toISOString() || new Date().toISOString(),
            channel_count: guild.channels.cache.size,
          };

          backupData.servers.push(serverData);
          backupData.statistics.total_channels += serverData.channel_count;
        }

        backupData.statistics.total_servers = backupData.servers.length;
      } catch (error) {
        log(`Error collecting servers data: ${error.message}`, "warn");
        backupData.servers = [];
      }

      await statusMsg.edit(
        "> 💾 **Creating backup...**\n> 👥 Collecting friends data... ✅\n> 🏠 Collecting servers data... ✅\n> 💾 Saving backup file..."
      );

      // Save backup to file
      const backupFilePath = path.join(backupDir, `${backupName}.json`);
      fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2));

      // Calculate file size
      const stats = fs.statSync(backupFilePath);
      const fileSizeKB = Math.round(stats.size / 1024);

      await statusMsg.edit(
        "> ✅ **Backup created successfully!**\n\n" +
          `> 📊 **Backup Statistics:**\n` +
          `> • Backup name: ${backupName}\n` +
          `> • Friends: ${backupData.statistics.total_friends}\n` +
          `> • Servers: ${backupData.statistics.total_servers}\n` +
          `> • Total channels: ${backupData.statistics.total_channels}\n` +
          `> • File size: ${fileSizeKB}KB\n` +
          `> • Location: data/backups/${backupName}.json\n\n` +
          `> Use \`${client.prefix}view ${backupName}\` to view this backup.`
      );

      log(
        `Backup created: ${backupName} - Friends: ${backupData.statistics.total_friends}, Servers: ${backupData.statistics.total_servers}`,
        "success"
      );
    } catch (error) {
      log(`Error creating backup: ${error.message}`, "error");
      await message.channel.send(
        "> ❌ **Backup creation failed!**\n" + `> **Error:** ${error.message}`
      );
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
