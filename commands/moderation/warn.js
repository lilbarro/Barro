import { log } from '../../utils/functions.js';
import { parseTime } from '../../utils/functions.js';
import fs from 'fs';
import path from 'path';

export default {
    name: 'warn',
    description: 'Warn a user and store the warning count.',
    aliases: ['warning'],
    usage: '<@member/ID> [reason]',
    category: 'moderation',
    type: 'server_only',
    permissions: ['ModerateMembers'],
    cooldown: 5,

    execute: async (client, message, args) => {
        const targets = [];
        let reason = null;

        // Extract multiple users from mentions or IDs and parse optional reason
        for (let arg of args) {
            if (message.mentions.members.size > 0 && !reason) {
                targets.push(...message.mentions.members.map(m => m.id));
            } else if (!isNaN(arg)) {
                try {
                    const member = await message.guild.members.fetch(arg);
                    targets.push(member.id);
                } catch (error) {
                    message.channel.send(`> ❌ Member with ID ${arg} not found.`);
                }
            } else {
                reason = args.slice(targets.length).join(' ');
                break;
            }
        }

        if (targets.length === 0) {
            return message.channel.send(`> ❌ **Incorrect Usage!**\nUsage: \`${client.prefix}warn <@member/ID> [reason]\`\nExample: \`${client.prefix}warn @user Spamming\``);
        }

        const warnFilePath = path.join(process.cwd(), 'data', 'warn.json');
        let warnData = {};

        // Ensure warn.json exists and load data
        if (!fs.existsSync(warnFilePath)) {
            fs.mkdirSync(path.dirname(warnFilePath), { recursive: true });
            fs.writeFileSync(warnFilePath, JSON.stringify({}));
        }
        warnData = JSON.parse(fs.readFileSync(warnFilePath, 'utf-8'));

        for (const targetId of targets) {
            try {
                const member = await message.guild.members.fetch(targetId);

                // Initialize or update warning count
                warnData[targetId] = warnData[targetId] ? warnData[targetId] + 1 : 1;

                // Send confirmation message
                message.channel.send(`> ⚠️ Warned ${member.user.tag} | Total Warnings: ${warnData[targetId]}${reason ? ` | Reason: ${reason}` : ''}`);
            } catch (error) {
                message.channel.send(`> ❌ Failed to warn ID: ${targetId}. Error: ${error.message}`);
            }
        }

        // Save updated data back to warn.json
        fs.writeFileSync(warnFilePath, JSON.stringify(warnData, null, 2));
    },
};