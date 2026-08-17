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
            const statusMsg = await message.channel.send(formatAnsiBlock([
                style(`Barro`, `4;30`) + style(` Info | Gathering data...`, '0;34')
            ]));
            
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
            
            const block1 = formatAnsiBlock([
                style(`Barro`, `4;30`) + style(` Selfbot Information`, '0;34')
            ]);

            const block2 = formatAnsiBlock([
                style('Performance', '4;30'),
                kv('Latency', `${ping}ms`, 12),
                kv('Memory', `${memoryMB.heapUsed}MB / ${memoryMB.heapTotal}MB`, 12),
                kv('CPU Usage', `~${cpuPercent}%`, 12),
                kv('Uptime', uptimeStr, 12)
            ]);

            const block3 = formatAnsiBlock([
                style('System', '4;30'),
                kv('Platform', platformName, 12),
                kv('Arch', arch, 12),
                kv('Node.js', nodeVersion, 12)
            ]);

            const block4 = formatAnsiBlock([
                style('Statistics', '4;30'),
                kv('Commands', commandCount, 12),
                kv('Events', eventCount, 12),
                kv('Lines', linesOfCode, 12)
            ]);

            const block5 = formatAnsiBlock([
                style('Identity', '4;30'),
                kv('Prefix', client.prefix, 12),
                kv('User', client.user.tag, 12),
                kv('ID', client.user.id, 12)
            ]);

            await statusMsg.edit([block1, block2, block3, block4, block5].join('\n'));
            
        } catch (error) {
            log(`Error generating selfinfo: ${error.message}`, 'error');
            await message.channel.send(formatAnsiBlock([
                style(`ERROR: Failed to generate info`, `1;94`),
                style(error.message, '0;34')
            ]));
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