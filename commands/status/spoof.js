import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    name: "spoof",
    description: "Spoof your Discord device",
    aliases: ["device"],
    usage: "<web|phone|console|pc>",
    category: "status",
    type: "both",
    ownerOnly: false,
    permissions: [],
    cooldown: 1,

    async execute(client, message, args) {
        if (args[0] && ["help", "--help", "-h"].includes(args[0].toLowerCase())) {
            return message.channel.send(`> **Spoof Help**\n> Usage: \`${client.prefix}spoof <web|phone|console|pc>\`\n> Aliases: \`${client.prefix}device\``);
        }

        try {
            const yaml = await import("js-yaml");

            const device = args[0]?.toLowerCase();

            if (!device) {
                return message.channel.send(`❌ Please specify a device: web, phone, console, or pc`);
            }

            const devices = {
                web: "Discord Web Client",
                phone: "Discord Mobile App",
                console: "Discord Console Client",
                pc: "Discord PC Client"
            };

            if (!devices[device]) {
                return message.channel.send(`❌ Invalid device! Use: web, phone, console, or pc`);
            }

            const newBrowser = devices[device];
            const reconnectToken = client.token;
            const configPath = path.join(__dirname, "..", "..", "config.yaml");
            const fileContents = fs.readFileSync(configPath, "utf8");
            const config = yaml.load(fileContents);

            if (!config.client_properties) {
                config.client_properties = {};
            }

            config.client_properties.browser = newBrowser;
            fs.writeFileSync(configPath, yaml.dump(config), "utf8");

            // Update the config object attached to the client for any new connections
            if (client.config) {
                if (!client.config.client_properties) client.config.client_properties = {};
                client.config.client_properties.browser = newBrowser;
            }

            if (client.options?.ws?.properties) {
                client.options.ws.properties.$browser = newBrowser;
            }
            if (client.ws?.options?.properties) {
                client.ws.options.properties.$browser = newBrowser;
            }

            await message.channel.send(`✅ Device spoofed to ${newBrowser}. Reconnecting this account now...`);

            if (!reconnectToken) {
                return message.channel.send('❌ Device saved, but this client has no token available for a live reconnect.');
            }

            await client.destroy();
            await client.login(reconnectToken);

            return message.channel.send(`✅ Device spoofed to ${newBrowser} and applied without restarting the bot.`);
        } catch (error) {
            console.error(`[DEBUG] Spoof Error: ${error.stack}`);
            return message.channel.send(`❌ Error: ${error.message}`);
        }
    }
};
