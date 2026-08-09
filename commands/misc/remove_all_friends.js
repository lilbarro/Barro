import TaskManager from "../../utils/TaskManager.js";
import RateLimitManager from "../../utils/RateLimitManager.js";
import { log, loadConfig, wait } from "../../utils/functions.js";
import axios from "axios";

export default {
  name: "remove_all_friends",
  description: "Remove all friends from the friends list.",
  aliases: ["unfriendall", "removefriends", "deletefriends"],
  usage: "",
  category: "misc",
  type: "dm_only",
  permissions: ["SendMessages"],
  cooldown: 60,

  execute: async (client, message, args) => {
    try {
      if (message.author.id !== client.user.id) return;

      // Load config to get API version
      const config = loadConfig();
      const apiVersion = config.api?.version || "v10"; // Default to v10 if not specified

      const task = TaskManager.createTask(
        "remove_all_friends",
        message.author.id
      );
      if (!task) {
        return message.reply(
          "A remove_all_friends task is already in progress."
        );
      }

      try {
        const rateLimiter = new RateLimitManager(1); // Conservative rate limiting

        // Get friends list - with error handling and fallbacks
        let friends = [];
        let friendCount = 0;

        try {
          // Method 1: Try using Discord.js client.user.friends
          if (
            client.user.friends &&
            typeof client.user.friends.fetch === "function"
          ) {
            const friendsCollection = await client.user.friends.fetch();
            if (friendsCollection && friendsCollection.size > 0) {
              friends = [...friendsCollection.values()];
              friendCount = friends.length;
              log(
                `Successfully fetched ${friendCount} friends using Discord.js`,
                "debug"
              );
            } else {
              log("Friends collection was empty or invalid", "warn");
            }
          } else {
            log(
              "client.user.friends.fetch is not available, trying alternative method",
              "warn"
            );
          }

          // Method 2: If Discord.js method fails or returns empty, try using relationships
          if (friends.length === 0 && client.relationships) {
            const relationships =
              client.relationships.friendCache || client.relationships.cache;
            if (relationships && relationships.size > 0) {
              friends = [...relationships.values()];
              friendCount = friends.length;
              log(
                `Successfully fetched ${friendCount} friends using relationships cache`,
                "debug"
              );
            } else {
              log("Relationships cache was empty or invalid", "warn");
            }
          }

          // Method 3: Last resort - try direct API call
          if (friends.length === 0) {
            log("Attempting to fetch friends via direct API call", "debug");
            const response = await axios.get(
              `https://discord.com/api/${apiVersion}/users/@me/relationships`,
              {
                headers: {
                  Authorization: client.token,
                  "Content-Type": "application/json",
                },
              }
            );

            if (response.data && Array.isArray(response.data)) {
              // Filter to only include friends (type 1)
              const friendRelationships = response.data.filter(
                (rel) => rel.type === 1
              );
              friends = friendRelationships;
              friendCount = friends.length;
              log(
                `Successfully fetched ${friendCount} friends using direct API call`,
                "debug"
              );
            }
          }
        } catch (error) {
          log(`Error fetching friends: ${error.message}`, "error");
        }

        if (friends.length === 0) {
          task.stop();
          return message.channel.send(
            "> ❌ Failed to fetch friends or you don't have any friends to remove!"
          );
        }

        let success = 0;
        let failed = 0;
        let isCancelled = false;

        // Create status message
        const statusMsg = await message.channel.send(
          `> ⏳ Removing ${friendCount} friends...\n` +
            `> ⏱️ Using delays between removals to avoid rate limits`
        );

        // Add cancellation listener
        if (task.signal) {
          task.signal.addEventListener("abort", () => {
            if (!task.signal.reason || task.signal.reason !== "completed") {
              isCancelled = true;
              statusMsg
                .edit(
                  `> ⚠️ Remove friends task cancelled after removing ${success} friends.`
                )
                .catch(() => {});
            }
          });
        }

        for (const friend of friends) {
          if (task.signal.aborted) break;

          try {
            await rateLimiter.execute(async () => {
              if (task.signal.aborted) return;

              let removeSuccess = false;

              // Method 1: Try using Discord.js
              try {
                // Handle both direct User objects and API relationship objects
                const userId =
                  friend?.id || friend?.user_id || friend?.user?.id;
                if (!userId) {
                  log(
                    `Invalid friend object: ${JSON.stringify(friend)}`,
                    "error"
                  );
                  failed++;
                  return;
                }

                // Try to get the user and remove friendship
                if (
                  friend &&
                  friend.remove &&
                  typeof friend.remove === "function"
                ) {
                  await friend.remove();
                  removeSuccess = true;
                  const friendTag = friend.tag || friend.username || userId;
                  log(`Friend removed: ${friendTag} (${userId})`, "debug");
                } else if (
                  friend?.user &&
                  friend.user.remove &&
                  typeof friend.user.remove === "function"
                ) {
                  await friend.user.remove();
                  removeSuccess = true;
                  const friendTag =
                    friend.user.tag || friend.user.username || userId;
                  log(`Friend removed: ${friendTag} (${userId})`, "debug");
                }
              } catch (err) {
                log(
                  `Discord.js remove method failed for user: ${err.message}`,
                  "warn"
                );
              }

              // Method 2: If Discord.js fails, try direct API call
              if (!removeSuccess) {
                try {
                  // Reuse the userId we already validated above, or get it again if needed
                  const userId =
                    friend?.id || friend?.user_id || friend?.user?.id;
                  if (!userId) {
                    failed++;
                    return;
                  }

                  // Remove friend using direct API call
                  await axios.delete(
                    `https://discord.com/api/${apiVersion}/users/@me/relationships/${userId}`,
                    {
                      headers: {
                        Authorization: client.token,
                        "Content-Type": "application/json",
                      },
                    }
                  );

                  removeSuccess = true;
                  log(`Removed friend ${userId} using direct API call`, "debug");
                } catch (err) {
                  log(
                    `Direct API remove method failed: ${err.message}`,
                    "error"
                  );
                  failed++;
                }
              }

              if (removeSuccess) {
                success++;
              } else {
                failed++;
              }

              // Update status every 3 removals
              if ((success + failed) % 3 === 0) {
                statusMsg
                  .edit(
                    `> ⏳ Removing friends... Progress: ${
                      success + failed
                    }/${friendCount}\n` +
                      `> ✅ Removed: ${success} | ❌ Failed: ${failed}`
                  )
                  .catch(() => {});
              }

              // Add a delay between removals to avoid rate limits
              await wait(2000); // 2 second delay
            }, task.signal);
          } catch (error) {
            if (task.signal.aborted || error.message.includes("cancelled"))
              break;
            failed++;
            const friendId =
              friend.id || friend.user_id || friend.user?.id || "unknown";
            log(`Error removing friend ${friendId}: ${error.message}`, "error");
          }
        }

        if (!isCancelled && !task.signal.aborted) {
          statusMsg
            .edit(
              `> ✅ Remove friends completed!\n` +
                `> 🗑️ Removed ${success} friends\n` +
                `> ❌ Failed: ${failed}`
            )
            .catch(() => {});
        }
      } catch (error) {
        log(`Error during remove_all_friends task: ${error.message}`, "error");
        message.channel.send("> ❌ An error occurred while removing friends.");
      } finally {
        task.stop();
      }
    } catch (error) {
      console.error(error);
      message.channel.send("> ❌ An unexpected error occurred.");
    }
  },
};
