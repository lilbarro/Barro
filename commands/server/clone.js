/**
 * CLONE COMMAND
 *
 * This command provides Discord server cloning functionality for selfbots.
 * It clones channels, categories, and roles from one server to another while
 * maintaining the exact same hierarchy and order.
 *
 * Features:
 * - Server access validation for both source and destination servers
 * - Channel and category cloning with hierarchy preservation
 * - Role cloning with permissions and hierarchy maintenance
 * - Comprehensive progress tracking and error handling
 * - Rate limiting to prevent Discord API abuse
 * - Task management for long-running operations
 *
 * WARNING: This is for selfbot use only. Ensure you have proper permissions
 * in the destination server (preferably Administrator) before running.
 *
 * @module commands/server/clone
 * @author lilbarro
 */

import { log, hasPermissions } from '../../utils/functions.js';
import TaskManager from '../../utils/TaskManager.js';
import RateLimitManager from '../../utils/RateLimitManager.js';



// Map string channel types to numeric values for API calls
const CHANNEL_TYPE_MAP = {
  'GUILD_TEXT': 0,
  'GUILD_VOICE': 2,
  'GUILD_CATEGORY': 4,
  'GUILD_NEWS': 5,
  'GUILD_STORE': 6,
  'GUILD_STAGE_VOICE': 13,
  'GUILD_DIRECTORY': 14,
  'GUILD_FORUM': 15,
  'GUILD_MEDIA': 16
};

export default {
  name: "clone",
  description: "Clone channels, categories, and roles from one server to another",
  aliases: ["cloneserver", "serverclone"],
  usage: 'clone <source_server_id> <destination_server_id>',
  category: 'server',
  type: 'server_only',
  permissions: ['ManageChannels', 'ManageRoles'],
  cooldown: 60, // Long cooldown due to intensive operation

  /**
   * Execute the clone command
   * @param {Client} client - Discord.js client instance
   * @param {Message} message - The message object
   * @param {Array} args - Command arguments [source_server_id, destination_server_id]
   */
  execute: async (client, message, args) => {
    try {
      // Validate arguments
      if (args.length < 2) {
        return message.channel.send(
          `> ❌ **Error:** Please provide both server IDs.\n> **Usage:** \`${client.prefix}clone <source_server_id> <destination_server_id>\``
        );
      }

      const sourceServerId = args[0];
      const destinationServerId = args[1];

      // Validate server ID format
      if (!/^\d{17,19}$/.test(sourceServerId) || !/^\d{17,19}$/.test(destinationServerId)) {
        return message.channel.send(
          '> ❌ **Error:** Invalid server ID format. Server IDs should be 17-19 digit numbers.'
        );
      }

      // Prevent cloning to the same server
      if (sourceServerId === destinationServerId) {
        return message.channel.send(
          '> ❌ **Error:** Source and destination servers cannot be the same.'
        );
      }

      // Create task for the cloning operation
      const task = TaskManager.createTask("clone", message.guild.id);
      if (!task) {
        return message.channel.send(
          '> ❌ **Error:** A clone task is already in progress for this server.'
        );
      }

      // Initialize rate limiter for API operations
      const rateLimiter = new RateLimitManager(3); // Conservative rate limiting

      try {
        // Send initial status message
        const statusMessage = await message.channel.send(
          '> ⏳ **Starting server clone process...**\n> 📋 **Step 1/4:** Validating server access...'
        );

        // Step 1: Validate server access
        const { sourceGuild, destinationGuild, hasAccess, error } = await validateServerAccess(
          client, sourceServerId, destinationServerId
        );

        if (!hasAccess) {
          await statusMessage.edit(`> ❌ **Error:** ${error}`);
          return;
        }

        await statusMessage.edit(
          `> ✅ **Server access validated**\n> 📋 **Step 2/4:** Analyzing source server structure...`
        );

        // Step 2: Analyze source server structure
        const serverStructure = await analyzeServerStructure(sourceGuild);

        await statusMessage.edit(
          `> ✅ **Server structure analyzed**\n` +
          `> 📊 **Found:** ${serverStructure.categories.length} categories, ${serverStructure.channels.length} channels, ${serverStructure.roles.length} roles\n` +
          `> 📋 **Step 3/4:** Cloning channels and categories...`
        );

        // Step 3: Clone channels and categories
        const channelResults = await cloneChannelsAndCategories(
          destinationGuild, serverStructure, rateLimiter, task, statusMessage
        );

        if (task.signal.aborted) {
          await statusMessage.edit('> ❌ **Clone operation was cancelled.**');
          return;
        }

        await statusMessage.edit(
          `> ✅ **Channels cloned:** ${channelResults.success}/${channelResults.total} (${channelResults.failed} failed)\n` +
          `> 📋 **Step 4/4:** Cloning roles...`
        );

        // Step 4: Clone roles
        const roleResults = await cloneRoles(
          destinationGuild, serverStructure, rateLimiter, task, statusMessage
        );

        if (task.signal.aborted) {
          await statusMessage.edit('> ❌ **Clone operation was cancelled.**');
          return;
        }

        // Final success message
        await statusMessage.edit(
          `> ✅ **Server clone completed successfully!**\n` +
          `> 📊 **Results:**\n` +
          `>   • Channels: ${channelResults.success}/${channelResults.total} (${channelResults.failed} failed)\n` +
          `>   • Roles: ${roleResults.success}/${roleResults.total} (${roleResults.failed} failed)\n` +
          `> 🎉 **Clone from \`${sourceGuild.name}\` to \`${destinationGuild.name}\` complete!**`
        );

        log(
          `Successfully cloned server ${sourceGuild.name} (${sourceServerId}) to ${destinationGuild.name} (${destinationServerId})`,
          'success'
        );

      } catch (error) {
        log(`Error during clone operation: ${error.message}`, 'error');

        // Try to update status message if it exists
        try {
          await message.channel.send(
            `> ❌ **Error:** Clone operation failed: ${error.message}`
          );
        } catch (sendError) {
          log(`Failed to send error message: ${sendError.message}`, 'error');
        }
      } finally {
        // Clean up the task
        task.stop();
      }

    } catch (error) {
      log(`Error in clone command: ${error.message}`, 'error');
      message.channel.send(
        '> ❌ **Error:** An unexpected error occurred while executing the clone command.'
      );
    }
  },
};

/**
 * Validate that the selfbot has access to both source and destination servers
 * @param {Client} client - Discord.js client instance
 * @param {string} sourceServerId - Source server ID
 * @param {string} destinationServerId - Destination server ID
 * @returns {Object} Validation result with guild objects and access status
 */
async function validateServerAccess(client, sourceServerId, destinationServerId) {
  try {
    // Check if selfbot has access to source server
    const sourceGuild = client.guilds.cache.get(sourceServerId);
    if (!sourceGuild) {
      return {
        hasAccess: false,
        error: `Cannot access source server (ID: ${sourceServerId}). Make sure the selfbot account is a member of this server.`
      };
    }

    // Check if selfbot has access to destination server
    const destinationGuild = client.guilds.cache.get(destinationServerId);
    if (!destinationGuild) {
      return {
        hasAccess: false,
        error: `Cannot access destination server (ID: ${destinationServerId}). Make sure the selfbot account is a member of this server.`
      };
    }

    // Check if selfbot has necessary permissions in destination server
    const destinationMember = destinationGuild.members.cache.get(client.user.id);
    if (!destinationMember) {
      return {
        hasAccess: false,
        error: `Selfbot is not a member of the destination server (${destinationGuild.name}).`
      };
    }

    // Check for required permissions in destination server
    const requiredPermissions = ['ManageChannels', 'ManageRoles'];
    const missingPermissions = [];

    for (const permission of requiredPermissions) {
      if (!hasPermissions(destinationMember, permission)) {
        missingPermissions.push(permission);
      }
    }

    if (missingPermissions.length > 0) {
      return {
        hasAccess: false,
        error: `Missing required permissions in destination server: ${missingPermissions.join(', ')}. Administrator permission is recommended for full functionality.`
      };
    }

    // Check if selfbot has Administrator permission for better results
    const hasAdministrator = hasPermissions(destinationMember, 'Administrator');
    if (!hasAdministrator) {
      log('Warning: Selfbot does not have Administrator permission. Some roles may not be cloned due to hierarchy restrictions.', 'warn');
    }

    log(`Server access validated: ${sourceGuild.name} -> ${destinationGuild.name}`, 'debug');

    return {
      hasAccess: true,
      sourceGuild,
      destinationGuild,
      error: null
    };

  } catch (error) {
    log(`Error validating server access: ${error.message}`, 'error');
    return {
      hasAccess: false,
      error: `Failed to validate server access: ${error.message}`
    };
  }
}

/**
 * Analyze the structure of the source server to prepare for cloning
 * @param {Guild} sourceGuild - Source Discord guild object
 * @returns {Object} Server structure with organized channels, categories, and roles
 */
async function analyzeServerStructure(sourceGuild) {
  try {
    log(`Analyzing structure of server: ${sourceGuild.name}`, 'debug');

    // Get all channels and sort them by position to maintain order
    const allChannels = Array.from(sourceGuild.channels.cache.values())
      .sort((a, b) => a.position - b.position);

    // Separate categories and regular channels
    const categories = allChannels.filter(channel => channel.type === 'GUILD_CATEGORY');
    const channels = allChannels.filter(channel => channel.type !== 'GUILD_CATEGORY');

    // Get all roles and sort them by position (highest first, excluding @everyone)
    const roles = Array.from(sourceGuild.roles.cache.values())
      .filter(role => role.name !== '@everyone')
      .sort((a, b) => b.position - a.position);

    // Create a mapping of categories to their channels for hierarchy preservation
    const categoryChannelMap = new Map();

    // Initialize category map
    categories.forEach(category => {
      categoryChannelMap.set(category.id, []);
    });

    // Group channels by their parent category and extract channel data
    channels.forEach(channel => {

      const channelData = {
        id: channel.id,
        name: channel.name,
        type: channel.type,
        position: channel.position,
        topic: channel.topic,
        nsfw: channel.nsfw,
        rateLimitPerUser: channel.rateLimitPerUser,
        bitrate: channel.bitrate,
        userLimit: channel.userLimit,
        permissionOverwrites: channel.permissionOverwrites ?
          Array.from(channel.permissionOverwrites.cache.values()).map(overwrite => ({
            id: overwrite.id,
            type: overwrite.type,
            allow: overwrite.allow,
            deny: overwrite.deny
          })) : []
      };

      if (channel.parentId) {
        if (categoryChannelMap.has(channel.parentId)) {
          categoryChannelMap.get(channel.parentId).push(channelData);
        }
      } else {
        // Channels without a category
        if (!categoryChannelMap.has('no-category')) {
          categoryChannelMap.set('no-category', []);
        }
        categoryChannelMap.get('no-category').push(channelData);
      }
    });

    // Sort channels within each category by position
    categoryChannelMap.forEach((channelList) => {
      channelList.sort((a, b) => a.position - b.position);
    });

    const structure = {
      categories: categories.map(category => ({
        id: category.id,
        name: category.name,
        position: category.position,
        permissionOverwrites: category.permissionOverwrites ?
          Array.from(category.permissionOverwrites.cache.values()) : [],
        channels: categoryChannelMap.get(category.id) || []
      })),
      channels: categoryChannelMap.get('no-category') || [], // Channels without categories
      roles: roles.map(role => ({
        id: role.id,
        name: role.name,
        color: role.color,
        hoist: role.hoist,
        position: role.position,
        permissions: role.permissions.bitfield,
        mentionable: role.mentionable,
        icon: role.icon,
        unicodeEmoji: role.unicodeEmoji
      }))
    };

    log(
      `Server structure analyzed: ${structure.categories.length} categories, ` +
      `${structure.channels.length + structure.categories.reduce((sum, cat) => sum + cat.channels.length, 0)} total channels, ` +
      `${structure.roles.length} roles`,
      'debug'
    );

    return structure;

  } catch (error) {
    log(`Error analyzing server structure: ${error.message}`, 'error');
    throw new Error(`Failed to analyze server structure: ${error.message}`);
  }
}

/**
 * Clone channels and categories from source to destination server
 * @param {Guild} destinationGuild - Destination Discord guild object
 * @param {Object} serverStructure - Analyzed server structure from source
 * @param {RateLimitManager} rateLimiter - Rate limiter instance
 * @param {Object} task - Task manager task object
 * @param {Message} statusMessage - Status message to update progress
 * @returns {Object} Results with success/failure counts
 */
async function cloneChannelsAndCategories(destinationGuild, serverStructure, rateLimiter, task, statusMessage) {
  const results = {
    success: 0,
    failed: 0,
    total: 0
  };

  try {
    // Calculate total items to clone
    results.total = serverStructure.categories.length +
                   serverStructure.channels.length +
                   serverStructure.categories.reduce((sum, cat) => sum + cat.channels.length, 0);

    log(`Starting to clone ${results.total} channels and categories`, 'debug');

    // Map to store created category IDs for channel parenting
    const categoryIdMap = new Map();

    // Step 1: Create categories first
    for (const categoryData of serverStructure.categories) {
      if (task.signal.aborted) {
        log('Clone operation aborted during category creation', 'warn');
        return results;
      }

      try {
        await rateLimiter.execute(async () => {
          const newCategory = await destinationGuild.channels.create(categoryData.name, {
            type: 4, // GUILD_CATEGORY
            position: categoryData.position,
            reason: 'Category cloned by selfbot'
          });

          // Store the mapping for later channel parenting
          categoryIdMap.set(categoryData.id, newCategory.id);

          log(`Created category: ${categoryData.name}`, 'debug');
          results.success++;
        }, task.signal);

        // Update progress
        await updateProgress(statusMessage, results, 'categories');

      } catch (error) {
        log(`Failed to create category ${categoryData.name}: ${error.message}`, 'error');
        results.failed++;
      }
    }

    // Step 2: Create channels without categories
    for (const channelData of serverStructure.channels) {
      if (task.signal.aborted) {
        log('Clone operation aborted during channel creation', 'warn');
        return results;
      }

      try {
        await rateLimiter.execute(async () => {
          await createChannel(destinationGuild, channelData, null);
          log(`Created channel: ${channelData.name}`, 'debug');
          results.success++;
        }, task.signal);

        // Update progress
        await updateProgress(statusMessage, results, 'channels');

      } catch (error) {
        log(`Failed to create channel ${channelData.name}: ${error.message}`, 'error');
        results.failed++;
        // Continue with next channel instead of stopping
      }
    }

    // Step 3: Create channels within categories
    for (const categoryData of serverStructure.categories) {
      if (task.signal.aborted) {
        log('Clone operation aborted during category channel creation', 'warn');
        return results;
      }

      const newCategoryId = categoryIdMap.get(categoryData.id);
      if (!newCategoryId) {
        log(`Skipping channels for failed category: ${categoryData.name}`, 'warn');
        continue;
      }

      for (const channelData of categoryData.channels) {
        if (task.signal.aborted) {
          log('Clone operation aborted during category channel creation', 'warn');
          return results;
        }

        try {
          await rateLimiter.execute(async () => {
            await createChannel(destinationGuild, channelData, newCategoryId);
            log(`Created channel: ${channelData.name} in category: ${categoryData.name}`, 'debug');
            results.success++;
          }, task.signal);

          // Update progress
          await updateProgress(statusMessage, results, 'channels');

        } catch (error) {
          log(`Failed to create channel ${channelData.name} in category ${categoryData.name}: ${error.message}`, 'error');
          results.failed++;
          // Continue with next channel instead of stopping
        }
      }
    }

    log(`Channel cloning completed: ${results.success} success, ${results.failed} failed`, 'debug');
    return results;

  } catch (error) {
    log(`Error during channel cloning: ${error.message}`, 'error');
    throw new Error(`Channel cloning failed: ${error.message}`);
  }
}

/**
 * Create a channel in the destination server
 * @param {Guild} destinationGuild - Destination Discord guild object
 * @param {Object} channelData - Channel data from source server
 * @param {string|null} parentId - Parent category ID (null for no category)
 */
async function createChannel(destinationGuild, channelData, parentId = null) {
  const channelOptions = {
    type: CHANNEL_TYPE_MAP[channelData.type] || channelData.type,
    reason: 'Channel cloned by selfbot'
  };

  // Add parent category if specified
  if (parentId) {
    channelOptions.parent = parentId;
  }

  // Add channel-specific properties based on type
  if (channelData.type === 'GUILD_TEXT' || channelData.type === 'GUILD_NEWS') {
    if (channelData.topic) channelOptions.topic = channelData.topic;
    if (channelData.nsfw !== undefined) channelOptions.nsfw = channelData.nsfw;
    if (channelData.rateLimitPerUser) channelOptions.rateLimitPerUser = channelData.rateLimitPerUser;
  } else if (channelData.type === 'GUILD_VOICE' || channelData.type === 'GUILD_STAGE_VOICE') {
    if (channelData.bitrate) channelOptions.bitrate = channelData.bitrate;
    if (channelData.userLimit) channelOptions.userLimit = channelData.userLimit;
  }

  // Create the channel with name as first parameter
  const newChannel = await destinationGuild.channels.create(channelData.name, channelOptions);

  // Apply permission overwrites if they exist
  if (channelData.permissionOverwrites && channelData.permissionOverwrites.length > 0) {
    for (const overwrite of channelData.permissionOverwrites) {
      try {
        // Skip overwrites for roles/users that don't exist in destination server
        if (overwrite.type === 'role') {
          const role = destinationGuild.roles.cache.find(r => r.name === overwrite.name);
          if (role) {
            await newChannel.permissionOverwrites.create(role, overwrite.allow, overwrite.deny);
          }
        }
      } catch (error) {
        log(`Failed to apply permission overwrite for channel ${channelData.name}: ${error.message}`, 'warn');
      }
    }
  }

  return newChannel;
}

/**
 * Update progress message with current status
 * @param {Message} statusMessage - Status message to update
 * @param {Object} results - Current results object
 * @param {string} currentStep - Current step being processed
 */
async function updateProgress(statusMessage, results, currentStep) {
  try {
    const progressText = `> ⏳ **Cloning ${currentStep}...** (${results.success + results.failed}/${results.total})`;

    // Only update every few operations to avoid rate limits
    if ((results.success + results.failed) % 5 === 0 || results.success + results.failed === results.total) {
      await statusMessage.edit(progressText);
    }
  } catch (error) {
    // Don't throw on progress update failures
    log(`Failed to update progress message: ${error.message}`, 'warn');
  }
}

/**
 * Clone roles from source to destination server
 * @param {Guild} destinationGuild - Destination Discord guild object
 * @param {Object} serverStructure - Analyzed server structure from source
 * @param {RateLimitManager} rateLimiter - Rate limiter instance
 * @param {Object} task - Task manager task object
 * @param {Message} statusMessage - Status message to update progress
 * @returns {Object} Results with success/failure counts
 */
async function cloneRoles(destinationGuild, serverStructure, rateLimiter, task, statusMessage) {
  const results = {
    success: 0,
    failed: 0,
    total: serverStructure.roles.length
  };

  try {
    log(`Starting to clone ${results.total} roles`, 'debug');

    // Get current selfbot member in destination server to check role hierarchy
    const selfbotMember = destinationGuild.members.cache.get(destinationGuild.client.user.id);
    const selfbotHighestPosition = selfbotMember ? selfbotMember.roles.highest.position : 1;

    // Clone roles in reverse order (lowest position first) to maintain hierarchy
    const rolesToClone = [...serverStructure.roles].reverse();

    for (const roleData of rolesToClone) {
      if (task.signal.aborted) {
        log('Clone operation aborted during role creation', 'warn');
        return results;
      }

      try {
        await rateLimiter.execute(async () => {
          // Skip roles that would be higher than selfbot's highest role
          // Only skip if selfbot doesn't have Administrator permission
          const selfbotHasAdmin = selfbotMember && hasPermissions(selfbotMember, 'Administrator');
          if (!selfbotHasAdmin && roleData.position >= selfbotHighestPosition) {
            log(`Skipping role ${roleData.name} - position too high (${roleData.position} >= ${selfbotHighestPosition})`, 'warn');
            results.failed++;
            return;
          }

          // Prepare role creation options
          const roleOptions = {
            name: roleData.name,
            color: roleData.color,
            hoist: roleData.hoist,
            mentionable: roleData.mentionable,
            permissions: roleData.permissions,
            reason: 'Role cloned by selfbot'
          };

          // Skip icon processing to avoid file system errors
          // Role icons require special handling and server boost level

          // Add unicode emoji if available
          if (roleData.unicodeEmoji) {
            roleOptions.unicodeEmoji = roleData.unicodeEmoji;
          }

          // Create the role
          const newRole = await destinationGuild.roles.create(roleOptions);

          // Try to set position if selfbot has admin permissions
          if (selfbotHasAdmin && roleData.position > 0) {
            try {
              await destinationGuild.roles.setPosition(newRole, roleData.position);
            } catch (positionError) {
              log(`Failed to set position for role ${roleData.name}: ${positionError.message}`, 'warn');
            }
          }

          log(`Created role: ${roleData.name} (position: ${roleData.position})`, 'debug');
          results.success++;
        }, task.signal);

        // Update progress
        await updateProgress(statusMessage, results, 'roles');

      } catch (error) {
        if (error.message.includes('needs more boosts')) {
          log(`Failed to create role ${roleData.name}: Server needs more boosts for this role`, 'warn');
        } else if (error.message.includes('cancelled')) {
          log(`Role creation cancelled for ${roleData.name}`, 'warn');
        } else {
          log(`Failed to create role ${roleData.name}: ${error.message}`, 'error');
        }
        results.failed++;
        // Continue with next role instead of stopping
      }
    }

    log(`Role cloning completed: ${results.success} success, ${results.failed} failed`, 'debug');
    return results;

  } catch (error) {
    log(`Error during role cloning: ${error.message}`, 'error');
    throw new Error(`Role cloning failed: ${error.message}`);
  }
}