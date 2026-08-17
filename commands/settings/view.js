import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { log } from "../../utils/functions.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "view",
  description: "View a previously created backup",
  aliases: ["viewbackup", "showbackup"],
  usage: "view <backup_name> | view list",
  category: "settings",
  type: "both",
  ownerOnly: true,
  permissions: ["SendMessages"],
  cooldown: 2,

  async execute(client, message, args) {
    if (!args.length) {
      return message.channel.send(
        "> ❌ **Please specify a backup to view!**\n" +
          `> **Usage:**\n` +
          `> • \`${client.prefix}view <backup_name>\` - View specific backup\n` +
          `> • \`${client.prefix}view list\` - List all backups`
      );
    }

    const backupDir = path.join(__dirname, "..", "..", "data", "backups");

    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
      return message.channel.send(
        "> ❌ **No backups found!** Create one using the backup command."
      );
    }

    const subcommand = args[0].toLowerCase();

    // Check if user has an active viewing session
    const viewTask = client.viewTasks?.get(message.author.id);

    // Handle navigation commands if there's an active viewing session
    if (viewTask) {
      // Handle "next" command
      if (subcommand === "next") {
        const totalItems =
          viewTask.section === "friends"
            ? viewTask.backupData.friends?.length || 0
            : viewTask.backupData.servers?.length || 0;

        const totalPages = Math.ceil(totalItems / viewTask.pageSize);

        if (viewTask.currentPage < totalPages) {
          viewTask.currentPage++;
          return this.showBackupPage(client, message, viewTask);
        } else {
          return message.channel.send("> ❌ You're already on the last page.");
        }
      }

      // Handle "prev" command
      else if (subcommand === "prev") {
        if (viewTask.currentPage > 1) {
          viewTask.currentPage--;
          return this.showBackupPage(client, message, viewTask);
        } else {
          return message.channel.send("> ❌ You're already on the first page.");
        }
      }

      // Handle "friends" command
      else if (subcommand === "friends") {
        viewTask.section = "friends";
        viewTask.currentPage = 1;
        return this.showBackupPage(client, message, viewTask);
      }

      // Handle "servers" command
      else if (subcommand === "servers") {
        viewTask.section = "servers";
        viewTask.currentPage = 1;
        return this.showBackupPage(client, message, viewTask);
      }

      // Handle "overview" command
      else if (subcommand === "overview") {
        viewTask.section = "overview";
        return this.showBackupPage(client, message, viewTask);
      }
    }

    // Handle list subcommand
    if (subcommand === "list") {
      return this.listBackups(client, message, backupDir);
    }

    // View specific backup
    return this.viewBackup(client, message, args[0], backupDir);
  },

  async listBackups(client, message, backupDir) {
    try {
      const backupFiles = fs
        .readdirSync(backupDir)
        .filter((file) => file.endsWith(".json"));

      if (backupFiles.length === 0) {
        return message.channel.send("> 📝 **No backups found!**");
      }

      let listText = `> 📋 **Available Backups (${backupFiles.length}):**\n\n`;

      for (const file of backupFiles) {
        const backupName = file.replace(".json", "");
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        const fileSizeKB = Math.round(stats.size / 1024);
        const createdDate = stats.birthtime.toLocaleDateString();

        // Try to read basic info from backup
        try {
          const backupData = JSON.parse(fs.readFileSync(filePath, "utf8"));
          const friendCount = backupData.statistics?.total_friends || 0;
          const serverCount = backupData.statistics?.total_servers || 0;

          listText += `> **${backupName}**\n`;
          listText += `> • Created: ${createdDate}\n`;
          listText += `> • Size: ${fileSizeKB}KB\n`;
          listText += `> • Friends: ${friendCount} | Servers: ${serverCount}\n\n`;
        } catch (error) {
          listText += `> **${backupName}** (corrupted)\n`;
          listText += `> • Created: ${createdDate}\n`;
          listText += `> • Size: ${fileSizeKB}KB\n\n`;
        }
      }

      listText += `> Use \`${client.prefix}view <backup_name>\` to view a specific backup.`;

      return message.channel.send(listText);
    } catch (error) {
      log(`Error listing backups: ${error.message}`, "error");
      return message.channel.send("> ❌ **Error listing backups!**");
    }
  },

  async viewBackup(client, message, backupName, backupDir) {
    try {
      const backupPath = path.join(backupDir, `${backupName}.json`);

      if (!fs.existsSync(backupPath)) {
        return message.channel.send(
          `> ❌ **Backup "${backupName}" not found!**\n` +
            `> Use \`${client.prefix}view list\` to see available backups.`
        );
      }

      const backupData = JSON.parse(fs.readFileSync(backupPath, "utf8"));
      const metadata = backupData.metadata || {};
      const stats = backupData.statistics || {};

      // Create a task for this viewing session
      const taskId = `view_backup_${message.author.id}`;
      const viewTask = {
        id: taskId,
        backupName,
        backupData,
        currentPage: 1,
        pageSize: 15,
        section: "overview", // 'overview', 'friends', 'servers'
        message: null,
      };

      // Store the task in client for reference
      if (!client.viewTasks) client.viewTasks = new Map();
      client.viewTasks.set(message.author.id, viewTask);

      // Show the first page (overview)
      await this.showBackupPage(client, message, viewTask);
    } catch (error) {
      log(`Error viewing backup: ${error.message}`, "error");
      return message.channel.send(
        `> ❌ **Error viewing backup "${backupName}"!**\n` +
          `> The backup file might be corrupted or invalid.`
      );
    }
  },

  async showBackupPage(client, message, viewTask) {
    const { backupName, backupData, currentPage, pageSize, section } = viewTask;
    const metadata = backupData.metadata || {};
    const stats = backupData.statistics || {};

    let backupText = "";
    let navigationText = "";

    // Overview section
    if (section === "overview") {
      backupText = `> 📋 **Backup: ${backupName}**\n\n`;

      // Metadata section
      backupText += `> **🔍 Metadata:**\n`;
      backupText += `> • Created: ${new Date(
        metadata.created_at
      ).toLocaleString()}\n`;
      backupText += `> • Selfbot User: ${
        metadata.selfbot_user?.tag || "Unknown"
      }\n`;
      backupText += `> • Selfbot ID: ${
        metadata.selfbot_user?.id || "Unknown"
      }\n\n`;

      // Statistics section
      backupText += `> **📊 Statistics:**\n`;
      backupText += `> • Total Friends: ${stats.total_friends || 0}\n`;
      backupText += `> • Total Servers: ${stats.total_servers || 0}\n`;
      backupText += `> • Total Channels: ${stats.total_channels || 0}\n\n`;

      // Navigation options
      navigationText = `> **📄 Navigation:**\n`;
      navigationText += `> • Type \`${client.prefix}view friends ${backupName}\` to view friends list\n`;
      navigationText += `> • Type \`${client.prefix}view servers ${backupName}\` to view servers list\n`;
    }

    // Friends section
    else if (section === "friends") {
      const totalFriends = backupData.friends?.length || 0;
      const totalPages = Math.ceil(totalFriends / pageSize);
      const startIdx = (currentPage - 1) * pageSize;
      const endIdx = Math.min(startIdx + pageSize, totalFriends);

      backupText = `> 👥 **Friends (${totalFriends})** - Page ${currentPage}/${
        totalPages || 1
      }\n\n`;

      if (totalFriends === 0) {
        backupText += `> No friends found in this backup.\n\n`;
      } else {
        const friendsToShow = backupData.friends.slice(startIdx, endIdx);

        for (const friend of friendsToShow) {
          backupText += `> • ${friend.tag} (${friend.id})\n`;
        }
        backupText += "\n";
      }

      // Navigation options
      navigationText = `> **📄 Navigation:**\n`;
      if (currentPage > 1) {
        navigationText += `> • Type \`${client.prefix}view prev\` for previous page\n`;
      }
      if (currentPage < totalPages) {
        navigationText += `> • Type \`${client.prefix}view next\` for next page\n`;
      }
      navigationText += `> • Type \`${client.prefix}view overview ${backupName}\` to return to overview\n`;
      navigationText += `> • Type \`${client.prefix}view servers ${backupName}\` to view servers list\n`;
    }

    // Servers section
    else if (section === "servers") {
      const totalServers = backupData.servers?.length || 0;
      const totalPages = Math.ceil(totalServers / pageSize);
      const startIdx = (currentPage - 1) * pageSize;
      const endIdx = Math.min(startIdx + pageSize, totalServers);

      backupText = `> 🏠 **Servers (${totalServers})** - Page ${currentPage}/${
        totalPages || 1
      }\n\n`;

      if (totalServers === 0) {
        backupText += `> No servers found in this backup.\n\n`;
      } else {
        const serversToShow = backupData.servers.slice(startIdx, endIdx);

        for (const server of serversToShow) {
          const memberCount = server.member_count || "Unknown";
          const channelCount = server.channel_count || 0;
          backupText += `> • ${server.name} (${server.id})\n`;
          backupText += `>   Members: ${memberCount} | Channels: ${channelCount}\n`;
        }
        backupText += "\n";
      }

      // Navigation options
      navigationText = `> **📄 Navigation:**\n`;
      if (currentPage > 1) {
        navigationText += `> • Type \`${client.prefix}view prev\` for previous page\n`;
      }
      if (currentPage < totalPages) {
        navigationText += `> • Type \`${client.prefix}view next\` for next page\n`;
      }
      navigationText += `> • Type \`${client.prefix}view overview ${backupName}\` to return to overview\n`;
      navigationText += `> • Type \`${client.prefix}view friends ${backupName}\` to view friends list\n`;
    }

    // Combine text and send
    const fullText = backupText + navigationText;

    // Send or edit message
    if (viewTask.message) {
      await viewTask.message.edit(fullText);
    } else {
      viewTask.message = await message.channel.send(fullText);
    }
  },
};
