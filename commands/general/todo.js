import { log } from "../../utils/functions.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "todo",
  description: "Manage your personal todo list",
  aliases: ["task", "reminder"],
  usage: "<task> | list | clear",
  category: "general",
  type: "both",
  permissions: ["SendMessages"],
  cooldown: 2,

  async execute(client, message, args) {
    try {
      const todoFile = path.join(__dirname, "..", "..", "data", "todo.txt");

      // Ensure data directory exists
      const dataDir = path.join(__dirname, "..", "..", "data");
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Handle subcommands
      if (args.length > 0) {
        const subcommand = args[0].toLowerCase();

        // List todos
        if (subcommand === "list") {
          return this.listTodos(message, todoFile);
        }

        // Clear todos
        if (subcommand === "clear") {
          return this.clearTodos(message, todoFile);
        }
      }

      // Add new todo
      if (!args.length) {
        return message.channel.send(
          `> ❌ **Usage:**\n` +
            `> • \`${client.prefix}todo <task>\` - Add a new todo\n` +
            `> • \`${client.prefix}todo list\` - List all todos\n` +
            `> • \`${client.prefix}todo clear\` - Clear all todos\n\n` +
            `> **Example:** \`${client.prefix}todo I have to complete my work\``
        );
      }

      // Add the todo
      const todoText = args.join(" ");
      return this.addTodo(message, todoFile, todoText);
    } catch (error) {
      log(`Error in todo command: ${error.message}`, "error");
      message.channel.send(`> ❌ An error occurred: ${error.message}`);
    }
  },

  /**
   * Add a new todo to the list
   */
  async addTodo(message, todoFile, todoText) {
    try {
      const timestamp = new Date().toLocaleString();
      const todoEntry = `[${timestamp}] ${todoText}\n`;

      // Append to todo file
      fs.appendFileSync(todoFile, todoEntry, "utf8");

      // Get current todo count
      const todoCount = this.getTodoCount(todoFile);

      await message.channel.send(
        `> ✅ **Todo added successfully!**\n` +
          `> **Task:** ${todoText}\n` +
          `> **Added:** ${timestamp}\n` +
          `> **Total todos:** ${todoCount}`
      );

      log(`Todo added by ${message.author.tag}: ${todoText}`, "debug");
    } catch (error) {
      log(`Error adding todo: ${error.message}`, "error");
      message.channel.send(`> ❌ Failed to add todo: ${error.message}`);
    }
  },

  /**
   * List all todos
   */
  async listTodos(message, todoFile) {
    try {
      if (!fs.existsSync(todoFile)) {
        return message.channel.send(
          `> 📝 **Your todo list is empty!**\n` +
            `> Use \`${message.client.prefix}todo <task>\` to add your first todo.`
        );
      }

      const todoContent = fs.readFileSync(todoFile, "utf8").trim();

      if (!todoContent) {
        return message.channel.send(
          `> 📝 **Your todo list is empty!**\n` +
            `> Use \`${message.client.prefix}todo <task>\` to add your first todo.`
        );
      }

      const todos = todoContent.split("\n").filter((line) => line.trim());
      const todoCount = todos.length;

      // Limit display to prevent message being too long
      const maxDisplay = 15;
      const displayTodos = todos.slice(-maxDisplay); // Show most recent todos

      let todoList = `> 📋 **Your Todo List (${todoCount} total):**\n\n`;

      displayTodos.forEach((todo, index) => {
        const actualIndex = todoCount - maxDisplay + index + 1;
        const displayIndex = actualIndex > 0 ? actualIndex : index + 1;
        todoList += `> **${displayIndex}.** ${todo}\n`;
      });

      if (todoCount > maxDisplay) {
        todoList += `\n> ... and ${todoCount - maxDisplay} more todos\n`;
      }

      todoList += `\n> Use \`${message.client.prefix}todo clear\` to clear all todos.`;

      await message.channel.send(todoList);

      log(
        `Todo list viewed by ${message.author.tag} (${todoCount} todos)`,
        "debug"
      );
    } catch (error) {
      log(`Error listing todos: ${error.message}`, "error");
      message.channel.send(`> ❌ Failed to list todos: ${error.message}`);
    }
  },

  /**
   * Clear all todos
   */
  async clearTodos(message, todoFile) {
    try {
      if (!fs.existsSync(todoFile)) {
        return message.channel.send(
          `> 📝 **Your todo list is already empty!**`
        );
      }

      const todoContent = fs.readFileSync(todoFile, "utf8").trim();

      if (!todoContent) {
        return message.channel.send(
          `> 📝 **Your todo list is already empty!**`
        );
      }

      // Get todo count before clearing
      const todoCount = this.getTodoCount(todoFile);

      // Create backup with timestamp
      const backupFile = todoFile.replace(".txt", `_backup_${Date.now()}.txt`);
      fs.copyFileSync(todoFile, backupFile);

      // Clear the todo file
      fs.writeFileSync(todoFile, "", "utf8");

      await message.channel.send(
        `> ✅ **Todo list cleared successfully!**\n` +
          `> **Cleared:** ${todoCount} todos\n` +
          `> **Backup created:** ${path.basename(backupFile)}\n` +
          `> You can start fresh with new todos!`
      );

      log(
        `Todo list cleared by ${message.author.tag} (${todoCount} todos cleared)`,
        "debug"
      );
    } catch (error) {
      log(`Error clearing todos: ${error.message}`, "error");
      message.channel.send(`> ❌ Failed to clear todos: ${error.message}`);
    }
  },

  /**
   * Get the current number of todos
   */
  getTodoCount(todoFile) {
    try {
      if (!fs.existsSync(todoFile)) {
        return 0;
      }

      const content = fs.readFileSync(todoFile, "utf8").trim();
      if (!content) {
        return 0;
      }

      return content.split("\n").filter((line) => line.trim()).length;
    } catch (error) {
      log(`Error getting todo count: ${error.message}`, "error");
      return 0;
    }
  },
};
