import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
<<<<<<< HEAD
import { log, style, formatAnsiBlock } from "../../utils/functions.js";
import { THEME } from "../../utils/theme.js";
=======
import { log } from "../../utils/functions.js";
>>>>>>> origin/main

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "view",
<<<<<<< HEAD
  description: "View a saved backup",
=======
  description: "View a previously created backup",
>>>>>>> origin/main
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
<<<<<<< HEAD
        formatAnsiBlock([
          style(`Barro`, THEME.HEADER_BOLD_COLOR) + style(` Backup | View`, THEME.ACCENT_COLOR),
          style(`❌ Please specify a backup to view!`, THEME.LABEL_COLOR),
          style(`Usage: `, THEME.LABEL_COLOR) + style(`\`${client.prefix}view <backup_name>\` - View specific backup`, THEME.ACCENT_COLOR),
          style(`Usage: `, THEME.LABEL_COLOR) + style(`\`${client.prefix}view list\` - List all backups`, THEME.ACCENT_COLOR)
        ])
=======
        "> ❌ **Please specify a backup to view!**\n" +
          `> **Usage:**\n` +
          `> • \`${client.prefix}view <backup_name>\` - View specific backup\n` +
          `> • \`${client.prefix}view list\` - List all backups`
>>>>>>> origin/main
      );
    }

    const backupDir = path.join(__dirname, "..", "..", "data", "backups");

    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
      return message.channel.send(
<<<<<<< HEAD
        formatAnsiBlock([
          style(`Barro`, THEME.HEADER_BOLD_COLOR) + style(` Backup | View`, THEME.ACCENT_COLOR),
          style(`❌ No backups found! Create one using the backup command.`, THEME.LABEL_COLOR)
        ])
=======
        "> ❌ **No backups found!** Create one using the backup command."
>>>>>>> origin/main
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
<<<<<<< HEAD
          return message.channel.send(
            formatAnsiBlock([
              style(`Barro`, THEME.HEADER_BOLD_COLOR) + style(` Backup | View`, THEME.ACCENT_COLOR),
              style(`❌ You're already on the last page.`, THEME.LABEL_COLOR)
            ])
          );
=======
          return message.channel.send("> ❌ You're already on the last page.");
>>>>>>> origin/main
        }
      }

      // Handle "prev" command
      else if (subcommand === "prev") {
        if (viewTask.currentPage > 1) {
          viewTask.currentPage--;
          return this.showBackupPage(client, message, viewTask);
        } else {
<<<<<<< HEAD
          return message.channel.send(
            formatAnsiBlock([
              style(`Barro`, THEME.HEADER_BOLD_COLOR) + style(` Backup | View`, THEME.ACCENT_COLOR),
              style(`❌ You're already on the first page.`, THEME.LABEL_COLOR)
            ])
          );
=======
          return message.channel.send("> ❌ You're already on the first page.");
>>>>>>> origin/main
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
<<<<<<< HEAD
        return message.channel.send(
          formatAnsiBlock([
            style(`Barro`, THEME.HEADER_BOLD_COLOR) + style(` Backup | View`, THEME.ACCENT_COLOR),
            style(`📝 No backups found!`, THEME.LABEL_COLOR)
          ])
        );
      }

      let listLines = [
        style(`Barro`, THEME.HEADER_BOLD_COLOR) + style(` Backup | Available Backups (${backupFiles.length})`, THEME.ACCENT_COLOR),
        ''
      ];
=======
        return message.channel.send("> 📝 **No backups found!**");
      }

      let listText = `> 📋 **Available Backups (${backupFiles.length}):**\n\n`;
>>>>>>> origin/main

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

<<<<<<< HEAD
          listLines.push(style(`${backupName}`, THEME.ACCENT_COLOR));
          listLines.push(style(`• Created: ${createdDate}`, THEME.LABEL_COLOR));
          listLines.push(style(`• Size: ${fileSizeKB}KB`, THEME.LABEL_COLOR));
          listLines.push(style(`• Friends: ${friendCount} | Servers: ${serverCount}`, THEME.LABEL_COLOR));
          listLines.push('');
        } catch (error) {
          listLines.push(style(`${backupName} (corrupted)`, THEME.LABEL_COLOR));
          listLines.push(style(`• Created: ${createdDate}`, THEME.LABEL_COLOR));
          listLines.push(style(`• Size: ${fileSizeKB}KB`, THEME.LABEL_COLOR));
          listLines.push('');
        }
      }

      listLines.push('');
      listLines.push(style(`Use \`${client.prefix}view <backup_name>\` to view a specific backup.`, THEME.LABEL_COLOR));

      return message.channel.send(formatAnsiBlock(listLines));
    } catch (error) {
      log(`Error listing backups: ${error.message}`, "error");
      return message.channel.send(
        formatAnsiBlock([
          style(`Barro`, THEME.HEADER_BOLD_COLOR) + style(` Backup | View`, THEME.ACCENT_COLOR),
          style(`❌ Error listing backups!`, THEME.LABEL_COLOR)
        ])
      );
=======
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
>>>>>>> origin/main
    }
  },

  async viewBackup(client, message, backupName, backupDir) {
    try {
      const backupPath = path.join(backupDir, `${backupName}.json`);

      if (!fs.existsSync(backupPath)) {
        return message.channel.send(
<<<<<<< HEAD
          formatAnsiBlock([
            style(`Barro`, THEME.HEADER_BOLD_COLOR) + style(` Backup | View`, THEME.ACCENT_COLOR),
            style(`❌ Backup "${backupName}" not found!`, THEME.LABEL_COLOR),
            style(`Use \`${client.prefix}view list\` to see available backups.`, THEME.LABEL_COLOR)
          ])
=======
          `> ❌ **Backup "${backupName}" not found!**\n` +
            `> Use \`${client.prefix}view list\` to see available backups.`
>>>>>>> origin/main
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
<<<<<<< HEAD
        formatAnsiBlock([
          style(`Barro`, THEME.HEADER_BOLD_COLOR) + style(` Backup | View`, THEME.ACCENT_COLOR),
          style(`❌ Error viewing backup "${backupName}"!`, THEME.LABEL_COLOR),
          style(`The backup file might be corrupted or invalid.`, THEME.LABEL_COLOR)
        ])
=======
        `> ❌ **Error viewing backup "${backupName}"!**\n` +
          `> The backup file might be corrupted or invalid.`
>>>>>>> origin/main
      );
    }
  },

  async showBackupPage(client, message, viewTask) {
    const { backupName, backupData, currentPage, pageSize, section } = viewTask;
    const metadata = backupData.metadata || {};
    const stats = backupData.statistics || {};

<<<<<<< HEAD
    let backupLines = [];
    let navigationLines = [];

    // Overview section
    if (section === "overview") {
      backupLines.push(style(`Barro`, THEME.HEADER_BOLD_COLOR) + style(` Backup: ${backupName}`, THEME.ACCENT_COLOR));
      backupLines.push('');

      // Metadata section
      backupLines.push(style(`🔍 Metadata:`, THEME.HEADER_BOLD_COLOR));
      backupLines.push(style(`• Created: ${new Date(
        metadata.created_at
      ).toLocaleString()}`, THEME.LABEL_COLOR));
      backupLines.push(style(`• Selfbot User: ${
        metadata.selfbot_user?.tag || "Unknown"
      }`, THEME.LABEL_COLOR));
      backupLines.push(style(`• Selfbot ID: ${
        metadata.selfbot_user?.id || "Unknown"
      }`, THEME.LABEL_COLOR));
      backupLines.push('');

      // Statistics section
      backupLines.push(style(`📊 Statistics:`, THEME.HEADER_BOLD_COLOR));
      backupLines.push(style(`• Total Friends: ${stats.total_friends || 0}`, THEME.LABEL_COLOR));
      backupLines.push(style(`• Total Servers: ${stats.total_servers || 0}`, THEME.LABEL_COLOR));
      backupLines.push(style(`• Total Channels: ${stats.total_channels || 0}`, THEME.LABEL_COLOR));
      backupLines.push('');

      // Navigation options
      navigationLines.push(style(`📄 Navigation:`, THEME.HEADER_BOLD_COLOR));
      navigationLines.push(style(`• Type \`${client.prefix}view friends ${backupName}\` to view friends list`, THEME.LABEL_COLOR));
      navigationLines.push(style(`• Type \`${client.prefix}view servers ${backupName}\` to view servers list`, THEME.LABEL_COLOR));
=======
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
>>>>>>> origin/main
    }

    // Friends section
    else if (section === "friends") {
      const totalFriends = backupData.friends?.length || 0;
      const totalPages = Math.ceil(totalFriends / pageSize);
      const startIdx = (currentPage - 1) * pageSize;
      const endIdx = Math.min(startIdx + pageSize, totalFriends);

<<<<<<< HEAD
      backupLines.push(style(`Barro`, THEME.HEADER_BOLD_COLOR) + style(` Friends (${totalFriends}) - Page ${currentPage}/${
        totalPages || 1
      }`, THEME.ACCENT_COLOR));
      backupLines.push('');

      if (totalFriends === 0) {
        backupLines.push(style(`No friends found in this backup.`, THEME.LABEL_COLOR));
        backupLines.push('');
=======
      backupText = `> 👥 **Friends (${totalFriends})** - Page ${currentPage}/${
        totalPages || 1
      }\n\n`;

      if (totalFriends === 0) {
        backupText += `> No friends found in this backup.\n\n`;
>>>>>>> origin/main
      } else {
        const friendsToShow = backupData.friends.slice(startIdx, endIdx);

        for (const friend of friendsToShow) {
<<<<<<< HEAD
          backupLines.push(style(`• ${friend.tag} (${friend.id})`, THEME.LABEL_COLOR));
        }
        backupLines.push("");
      }

      // Navigation options
      navigationLines.push(style(`📄 Navigation:`, THEME.HEADER_BOLD_COLOR));
      if (currentPage > 1) {
        navigationLines.push(style(`• Type \`${client.prefix}view prev\` for previous page`, THEME.LABEL_COLOR));
      }
      if (currentPage < totalPages) {
        navigationLines.push(style(`• Type \`${client.prefix}view next\` for next page`, THEME.LABEL_COLOR));
      }
      navigationLines.push(style(`• Type \`${client.prefix}view overview ${backupName}\` to return to overview`, THEME.LABEL_COLOR));
      navigationLines.push(style(`• Type \`${client.prefix}view servers ${backupName}\` to view servers list`, THEME.LABEL_COLOR));
=======
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
>>>>>>> origin/main
    }

    // Servers section
    else if (section === "servers") {
      const totalServers = backupData.servers?.length || 0;
      const totalPages = Math.ceil(totalServers / pageSize);
      const startIdx = (currentPage - 1) * pageSize;
      const endIdx = Math.min(startIdx + pageSize, totalServers);

<<<<<<< HEAD
      backupLines.push(style(`Barro`, THEME.HEADER_BOLD_COLOR) + style(` Servers (${totalServers}) - Page ${currentPage}/${
        totalPages || 1
      }`, THEME.ACCENT_COLOR));
      backupLines.push('');

      if (totalServers === 0) {
        backupLines.push(style(`No servers found in this backup.`, THEME.LABEL_COLOR));
        backupLines.push('');
=======
      backupText = `> 🏠 **Servers (${totalServers})** - Page ${currentPage}/${
        totalPages || 1
      }\n\n`;

      if (totalServers === 0) {
        backupText += `> No servers found in this backup.\n\n`;
>>>>>>> origin/main
      } else {
        const serversToShow = backupData.servers.slice(startIdx, endIdx);

        for (const server of serversToShow) {
          const memberCount = server.member_count || "Unknown";
          const channelCount = server.channel_count || 0;
<<<<<<< HEAD
          backupLines.push(style(`• ${server.name} (${server.id})`, THEME.ACCENT_COLOR));
          backupLines.push(style(`  Members: ${memberCount} | Channels: ${channelCount}`, THEME.LABEL_COLOR));
        }
        backupLines.push("");
      }

      // Navigation options
      navigationLines.push(style(`📄 Navigation:`, THEME.HEADER_BOLD_COLOR));
      if (currentPage > 1) {
        navigationLines.push(style(`• Type \`${client.prefix}view prev\` for previous page`, THEME.LABEL_COLOR));
      }
      if (currentPage < totalPages) {
        navigationLines.push(style(`• Type \`${client.prefix}view next\` for next page`, THEME.LABEL_COLOR));
      }
      navigationLines.push(style(`• Type \`${client.prefix}view overview ${backupName}\` to return to overview`, THEME.LABEL_COLOR));
      navigationLines.push(style(`• Type \`${client.prefix}view friends ${backupName}\` to view friends list`, THEME.LABEL_COLOR));
    }

    // Combine text and send
    const fullText = formatAnsiBlock([...backupLines, ...navigationLines]);
=======
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
>>>>>>> origin/main

    // Send or edit message
    if (viewTask.message) {
      await viewTask.message.edit(fullText);
    } else {
      viewTask.message = await message.channel.send(fullText);
    }
  },
};
