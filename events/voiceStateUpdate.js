/**
 * VOICE STATE UPDATE EVENT HANDLER
 *
 * This event handler processes voice channel state changes for users.
 * It handles two main functionalities:
 * - Stalk logging: Records voice activity for users being stalked
 * - Auto-reconnect: Automatically reconnects the selfbot to voice channels
 *
 * Voice state changes include joining, leaving, and moving between voice channels,
 * as well as mute/deafen status changes. The handler logs these activities
 * for stalked users and manages selfbot voice connection stability.
 *
 * @module events/voiceStateUpdate
 * @author lilbarro
 */

import { log } from "../utils/functions.js";
import StalkManager from "../utils/StalkManager.js";

export default {
  name: "voiceStateUpdate",
  once: false,

  /**
   * Handle voice state changes for users and selfbot
   *
   * @async
   * @function execute
   * @param {Client} client - Discord.js client instance
   * @param {VoiceState} oldState - Previous voice state
   * @param {VoiceState} newState - New voice state
   * @description Processes voice channel activity for stalk logging and
   *              manages selfbot auto-reconnect functionality when disconnected
   *              from voice channels unexpectedly.
   */
  execute: async (client, oldState, newState) => {
    // Handle stalk logging for monitored users' voice activity
    if (StalkManager.isStalking(oldState.id)) {
      const userId = oldState.id;
      const guildName = oldState.guild?.name || newState.guild?.name;

      // User joined a voice channel (wasn't in voice, now is)
      if (!oldState.channelId && newState.channelId) {
        StalkManager.logVoiceEvent(userId, "VOICE_JOIN", {
          guildName: guildName,
          channelName: newState.channel.name,
        });
      }
      // User left a voice channel (was in voice, now isn't)
      else if (oldState.channelId && !newState.channelId) {
        StalkManager.logVoiceEvent(userId, "VOICE_LEAVE", {
          guildName: guildName,
          channelName: oldState.channel.name,
        });
      }
      // User moved between voice channels (changed channels)
      else if (
        oldState.channelId &&
        newState.channelId &&
        oldState.channelId !== newState.channelId
      ) {
        StalkManager.logVoiceEvent(userId, "VOICE_MOVE", {
          guildName: guildName,
          oldChannelName: oldState.channel.name,
          newChannelName: newState.channel.name,
        });
      }
    }

    // Handle selfbot auto-reconnect functionality
    // Only process voice state changes for the selfbot itself
    if (oldState.id !== client.user.id) return;

    // Check if auto-reconnect is enabled in configuration
    const vcConfig = client.config.vc_command;
    if (!vcConfig || !vcConfig.auto_reconnect) return;

    // Detect when selfbot gets disconnected from voice channel
    if (oldState.channelId && !newState.channelId) {
      log(
        `Selfbot disconnected from voice channel: ${
          oldState.channel?.name || oldState.channelId
        }`,
        "debug"
      );

      // Check if we have a record of the last joined channel
      const lastChannel = client.lastJoinedVoiceChannel;
      if (!lastChannel) {
        log(
          "No last joined voice channel recorded, cannot auto-reconnect.",
          "debug"
        );
        return;
      }

      if (lastChannel.attempts >= vcConfig.max_attempts) {
        log(
          `Max auto-reconnect attempts (${vcConfig.max_attempts}) reached for ${lastChannel.channelId}. Giving up.`,
          "error"
        );
        client.lastJoinedVoiceChannel = null;
        return;
      }

      lastChannel.attempts++;
      log(
        `Attempting to auto-reconnect to ${lastChannel.channelId} (Attempt ${lastChannel.attempts}/${vcConfig.max_attempts})...`,
        "debug"
      );

      setTimeout(async () => {
        try {
          const guild = client.guilds.cache.get(lastChannel.guildId);
          if (!guild) {
            log(
              `Guild ${lastChannel.guildId} not found for auto-reconnect.`,
              "error"
            );
            return;
          }

          const channel = await guild.channels.fetch(lastChannel.channelId);
          if (
            !channel ||
            (channel.type !== "GUILD_VOICE" &&
              channel.type !== "GUILD_STAGE_VOICE")
          ) {
            log(
              `Last joined channel ${lastChannel.channelId} is no longer a valid voice channel for auto-reconnect.`,
              "error"
            );
            return;
          }

          // Attempt to join via WebSocket opcode 4
          if (client.ws.shards.first()) {
            client.ws.shards.first().send({
              op: 4,
              d: {
                guild_id: lastChannel.guildId,
                channel_id: lastChannel.channelId,
                self_mute: lastChannel.mute,
                self_deaf: lastChannel.deafen,
              },
            });
            log(
              `Successfully re-attempted to join voice channel: ${channel.name} (${channel.id})`,
              "success"
            );
          } else {
            log(
              "Could not access WebSocket shard for auto-reconnect.",
              "error"
            );
          }
        } catch (error) {
          log(`Error during auto-reconnect attempt: ${error.message}`, "error");
        }
      }, vcConfig.reconnect_delay * 1000);
    }
  },
};
