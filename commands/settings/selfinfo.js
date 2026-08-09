import os from 'os';
import process from 'process';
import { log } from '../../utils/functions.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    name: 'selfinfo',
    description: 'Display detailed information about the selfbot',
    aliases: ['botinfo', 'info', 'stats'],
    usage: 'selfinfo',
    category: 'settings',
    type: 'both',
    permissions: ['SendMessages'],
    cooldown: 10,

    async execute(client, message, args) {
        try {
            const statusMsg = await message.channel.send('> 📊 **Gathering selfbot information...**');
            
            // Get system info
            const platform = os.platform();
            const arch = os.arch();
            const nodeVersion = process.version;
            const uptime = process.uptime();
            const memoryUsage = process.memoryUsage();
            
            // Calculate memory usage in MB
            const memoryMB = {
                rss: Math.round(memoryUsage.rss / 1024 / 1024),
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                external: Math.round(memoryUsage.external / 1024 / 1024)
            };
            
            // Get CPU usage (approximation)
            const cpuUsage = process.cpuUsage();
            const cpuPercent = Math.round((cpuUsage.user + cpuUsage.system) / 1000000); // Convert to percentage approximation
            
            // Format uptime
            const days = Math.floor(uptime / 86400);
            const hours = Math.floor((uptime % 86400) / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);
            const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;
            
            // Get command and event counts
            const commandCount = client.commands ? client.commands.size : 0;
            const eventCount = await this.getEventCount();
            
            // Calculate lines of code
            const linesOfCode = await this.calculateLinesOfCode();
            
            // Get latency
            const ping = client.ws.ping;
            
            // Format platform name
            const platformName = this.formatPlatformName(platform);
            
            // Create info message
            const infoMessage = 
                `> 🤖 **Barro Selfbot Information**\n\n` +
                `> **⚡ Performance:**\n` +
                `> • Latency: ${ping}ms\n` +
                `> • Memory Usage: ${memoryMB.heapUsed}MB / ${memoryMB.heapTotal}MB\n` +
                `> • CPU Usage: ~${cpuPercent}%\n` +
                `> • Uptime: ${uptimeStr}\n\n` +
                `> **🖥️ System:**\n` +
                `> • Platform: ${platformName}\n` +
                `> • Architecture: ${arch}\n` +
                `> • Node.js: ${nodeVersion}\n\n` +
                `> **📊 Statistics:**\n` +
                `> • Commands: ${commandCount}\n` +
                `> • Events: ${eventCount}\n` +
                `> • Lines of Code: ${linesOfCode}\n\n` +
                `> **👨‍💻 Developer:**\n` +
                `> • Created by: [lilbarro](https://github.com/lilbarro)\n` +
                `> • Source: [GitHub](https://github.com/lilbarro/Barro)\n\n` +
                `> **🔧 Current Status:**\n` +
                `> • Prefix: \`${client.prefix}\`\n` +
                `> • User: ${client.user.tag}\n` +
                `> • ID: ${client.user.id}`;
            
            await statusMsg.edit(infoMessage);
            
        } catch (error) {
            log(`Error generating selfinfo: ${error.message}`, 'error');
            await message.channel.send(
                `> ❌ **Error generating selfbot info!**\n` +
                `> **Error:** ${error.message}`
            );
        }
    },

    async getEventCount() {
        try {
            const eventsDir = path.join(__dirname, '..', '..', 'events');
            return this.countJSFiles(eventsDir);
        } catch (error) {
            return 0;
        }
    },

    async calculateLinesOfCode() {
        try {
            const projectDir = path.join(__dirname, '..', '..');
            let totalLines = 0;
            
            // Count lines in main files
            const mainFiles = ['index.js'];
            for (const file of mainFiles) {
                const filePath = path.join(projectDir, file);
                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath, 'utf8');
                    totalLines += content.split('\n').length;
                }
            }
            
            // Count lines in handlers
            const handlersDir = path.join(projectDir, 'handlers');
            totalLines += await this.countLinesInDirectory(handlersDir);
            
            // Count lines in utils
            const utilsDir = path.join(projectDir, 'utils');
            totalLines += await this.countLinesInDirectory(utilsDir);
            
            // Count lines in commands
            const commandsDir = path.join(projectDir, 'commands');
            totalLines += await this.countLinesInDirectory(commandsDir);
            
            // Count lines in events
            const eventsDir = path.join(projectDir, 'events');
            totalLines += await this.countLinesInDirectory(eventsDir);
            
            return totalLines;
        } catch (error) {
            return 0;
        }
    },

    async countLinesInDirectory(dir) {
        let totalLines = 0;
        
        if (!fs.existsSync(dir)) return 0;
        
        const files = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const file of files) {
            const filePath = path.join(dir, file.name);
            
            if (file.isDirectory()) {
                totalLines += await this.countLinesInDirectory(filePath);
            } else if (file.name.endsWith('.js')) {
                const content = fs.readFileSync(filePath, 'utf8');
                totalLines += content.split('\n').length;
            }
        }
        
        return totalLines;
    },

    countJSFiles(dir) {
        let count = 0;
        
        if (!fs.existsSync(dir)) return 0;
        
        const files = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const file of files) {
            const filePath = path.join(dir, file.name);
            
            if (file.isDirectory()) {
                count += this.countJSFiles(filePath);
            } else if (file.name.endsWith('.js')) {
                count++;
            }
        }
        
        return count;
    },

    formatPlatformName(platform) {
        const platformMap = {
            'win32': 'Windows',
            'darwin': 'macOS',
            'linux': 'Linux',
            'freebsd': 'FreeBSD',
            'openbsd': 'OpenBSD',
            'android': 'Android'
        };
        
        return platformMap[platform] || platform;
    }
};