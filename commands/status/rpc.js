export default {
    name: 'rpc',
    description: "Manages the bot's Rich Presence with comprehensive customization",
    aliases: ['richpresence', 'presence'],
    usage: '<enable|disable|setType|setURL|setState|setName|setDetails|setParty|setStartTimestamp|setEndTimestamp|view|reset>',
    category: 'status',
    type: 'both',
    permissions: ['SendMessages'],
    cooldown: 3,
    
    async execute(client, message, args) {
        try {
            if (!client.rpcManager) {
                return message.channel.send("> ❌ **Error:** RPC system not initialized. Please restart the bot.");
            }

            const subcommand = args[0] ? args[0].toLowerCase() : null;
            
            if (!subcommand) {
                return this.showHelp(message, client);
            }

            switch (subcommand) {
                case 'enable':
                    return await this.enableRPC(client, message);
                    
                case 'disable':
                    return await this.disableRPC(client, message);
                    
                case 'settype':
                    return await this.setType(client, message, args.slice(1));
                    
                case 'seturl':
                    return await this.setURL(client, message, args.slice(1));
                    
                case 'setstate':
                    return await this.setState(client, message, args.slice(1));
                    
                case 'setname':
                    return await this.setName(client, message, args.slice(1));
                    
                case 'setdetails':
                    return await this.setDetails(client, message, args.slice(1));
                    
                case 'setparty':
                    return await this.setParty(client, message, args.slice(1));
                    
                case 'setstarttimestamp':
                    return await this.setStartTimestamp(client, message, args.slice(1));
                    
                case 'setendtimestamp':
                    return await this.setEndTimestamp(client, message, args.slice(1));
                    
                case 'setlargeimage':
                    return await this.setLargeImage(client, message, args.slice(1));
                    
                case 'setlargetext':
                    return await this.setLargeText(client, message, args.slice(1));
                    
                case 'setsmallimage':
                    return await this.setSmallImage(client, message, args.slice(1));
                    
                case 'setsmalltext':
                    return await this.setSmallText(client, message, args.slice(1));
                    
                case 'addbutton':
                    return await this.addButton(client, message, args.slice(1));
                    
                case 'clearbuttons':
                    return await this.clearButtons(client, message);
                    
                case 'view':
                    return await this.viewConfig(client, message);
                    
                case 'reset':
                    return await this.resetConfig(client, message);
                    
                default:
                    return message.channel.send(`> ❌ **Unknown subcommand:** \`${subcommand}\`\n${this.getUsage()}`);
            }
        } catch (error) {
            return message.channel.send(`> ❌ **Error:** ${error.message}`);
        }
    },

    showHelp(message, client) {
        const helpText = `> **⚡ Rich Presence Commands**
>
> **Usage:** \`${client.prefix}rpc <subcommand> [args]\`
>
> **Available Commands:**
> • \`enable\` - Enable Rich Presence
> • \`disable\` - Disable Rich Presence
> • \`setType <type>\` - Set activity type (PLAYING, STREAMING, LISTENING, WATCHING, COMPETING)
> • \`setURL <url>\` - Set streaming URL (only for STREAMING type)
> • \`setState <state>\` - Set activity state text
> • \`setName <name>\` - Set activity name
> • \`setDetails <details>\` - Set activity details
> • \`setParty <current> <max>\` - Set party size (e.g., \`1 5\`)
> • \`setStartTimestamp <timestamp>\` - Set start time (ms or date)
> • \`setEndTimestamp <timestamp>\` - Set end time (ms or date)
> • \`setLargeImage <image>\` - Set large image asset
> • \`setLargeText <text>\` - Set large image hover text
> • \`setSmallImage <image>\` - Set small image asset
> • \`setSmallText <text>\` - Set small image hover text
> • \`addButton <label> <url>\` - Add a button (max 2)
> • \`clearButtons\` - Clear all buttons
> • \`view\` - View current configuration
> • \`reset\` - Reset to default configuration
>
> **Examples:**
> • \`${client.prefix}rpc setType STREAMING\`
> • \`${client.prefix}rpc setURL https://twitch.tv/example\`
> • \`${client.prefix}rpc setParty 1 9\`
> • \`${client.prefix}rpc setLargeImage 929325841350000660\`
> • \`${client.prefix}rpc addButton "Visit GitHub" https://github.com/lilbarro/Barro\`
> • \`${client.prefix}rpc setStartTimestamp ${Date.now()}\``;
        
        return message.channel.send(helpText);
    },

    getUsage() {
        return `Usage: \`+rpc <enable|disable|setType|setURL|setState|setName|setDetails|setParty|setStartTimestamp|setEndTimestamp|setLargeImage|setLargeText|setSmallImage|setSmallText|addButton|clearButtons|view|reset>\``;
    },

    async enableRPC(client, message) {
        const config = client.rpcManager.getCurrentConfig() || this.getDefaultConfig();
        config.rpc.enabled = true;
        
        client.rpcManager.updateConfig(config);
        
        const success = await client.rpcManager.updatePresence(client);
        if (success) {
            return message.channel.send("> ✅ **Rich Presence enabled successfully!**");
        }
        return message.channel.send("> ⚠️ **Rich Presence enabled but failed to update.**");
    },

    async disableRPC(client, message) {
        const config = client.rpcManager.getCurrentConfig() || this.getDefaultConfig();
        config.rpc.enabled = false;
        
        client.rpcManager.updateConfig(config);
        
        await client.user.setActivity(null);
        return message.channel.send("> ✅ **Rich Presence disabled successfully!**");
    },

    async setType(client, message, args) {
        if (!args[0]) {
            return message.channel.send("> ❌ **Please specify an activity type.**\nValid types: `PLAYING`, `STREAMING`, `LISTENING`, `WATCHING`, `COMPETING`");
        }

        const validTypes = ["PLAYING", "STREAMING", "LISTENING", "WATCHING", "COMPETING"];
        const type = args[0].toUpperCase();
        
        if (!validTypes.includes(type)) {
            return message.channel.send(`> ❌ **Invalid type.**\nValid types: ${validTypes.join(', ')}`);
        }

        const config = client.rpcManager.getCurrentConfig() || this.getDefaultConfig();
        config.rpc.default.type = type;
        
        if (type === "STREAMING" && !config.rpc.default.url) {
            config.rpc.default.url = "https://www.twitch.tv/directory";
        }
        
        client.rpcManager.updateConfig(config);
        
        const success = await client.rpcManager.updatePresence(client);
        if (success) {
            return message.channel.send(`> ✅ **Activity type set to \`${type}\`**`);
        }
        return message.channel.send("> ❌ **Failed to update configuration.**");
    },

    async setURL(client, message, args) {
        if (!args[0]) {
            return message.channel.send("> ❌ **Please specify a URL.**");
        }

        const url = args.join(' ');
        
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return message.channel.send("> ❌ **Invalid URL format.** Must start with http:// or https://");
        }

        const config = client.rpcManager.getCurrentConfig() || this.getDefaultConfig();
        
        if (config.rpc.default.type !== "STREAMING") {
            return message.channel.send("> ⚠️ **Warning:** URL will only work when activity type is set to `STREAMING`.");
        }

        config.rpc.default.url = url;
        
        client.rpcManager.updateConfig(config);
        
        const success = await client.rpcManager.updatePresence(client);
        if (success) {
            return message.channel.send(`> ✅ **Streaming URL set to \`${url}\`**`);
        }
        return message.channel.send("> ❌ **Failed to update configuration.**");
    },

    async setState(client, message, args) {
        if (!args[0]) {
            return message.channel.send("> ❌ **Please specify a state text.**");
        }

        const state = args.join(' ');
        
        if (state.length > 128) {
            return message.channel.send("> ❌ **State text too long.** Maximum 128 characters.");
        }

        const config = client.rpcManager.getCurrentConfig() || this.getDefaultConfig();
        config.rpc.default.state = state;
        
        client.rpcManager.updateConfig(config);
        
        const success = await client.rpcManager.updatePresence(client);
        if (success) {
            return message.channel.send(`> ✅ **State set to: \`${state}\`**`);
        }
        return message.channel.send("> ❌ **Failed to update configuration.**");
    },

    async setName(client, message, args) {
        if (!args[0]) {
            return message.channel.send("> ❌ **Please specify an activity name.**");
        }

        const name = args.join(' ');
        
        if (name.length > 128) {
            return message.channel.send("> ❌ **Name too long.** Maximum 128 characters.");
        }

        const config = client.rpcManager.getCurrentConfig() || this.getDefaultConfig();
        config.rpc.default.name = name;
        
        client.rpcManager.updateConfig(config);
        
        const success = await client.rpcManager.updatePresence(client);
        if (success) {
            return message.channel.send(`> ✅ **Activity name set to: \`${name}\`**`);
        }
        return message.channel.send("> ❌ **Failed to update configuration.**");
    },

    async setDetails(client, message, args) {
        if (!args[0]) {
            return message.channel.send("> ❌ **Please specify details text.**");
        }

        const details = args.join(' ');
        
        if (details.length > 128) {
            return message.channel.send("> ❌ **Details too long.** Maximum 128 characters.");
        }

        const config = client.rpcManager.getCurrentConfig() || this.getDefaultConfig();
        config.rpc.default.details = details;
        
        client.rpcManager.updateConfig(config);
        
        const success = await client.rpcManager.updatePresence(client);
        if (success) {
            return message.channel.send(`> ✅ **Details set to: \`${details}\`**`);
        }
        return message.channel.send("> ❌ **Failed to update configuration.**");
    },

    async setParty(client, message, args) {
        if (args.length < 2) {
            return message.channel.send("> ❌ **Usage:** `+rpc setParty <current> <max>`\nExample: `+rpc setParty 1 9`");
        }

        const current = parseInt(args[0]);
        const max = parseInt(args[1]);

        if (isNaN(current) || isNaN(max)) {
            return message.channel.send("> ❌ **Both values must be valid numbers.**");
        }

        if (current < 1 || max < 1) {
            return message.channel.send("> ❌ **Both values must be positive numbers.**");
        }

        if (current > max) {
            return message.channel.send("> ❌ **Current value cannot exceed max value.**");
        }

        const config = client.rpcManager.getCurrentConfig() || this.getDefaultConfig();
        config.rpc.default.party = {
            current: current,
            max: max,
            id: client.rpcManager.generateUUID()
        };
        
        client.rpcManager.updateConfig(config);
        
        const success = await client.rpcManager.updatePresence(client);
        if (success) {
            return message.channel.send(`> ✅ **Party set to ${current}/${max}**`);
        }
        return message.channel.send("> ❌ **Failed to update configuration.**");
    },

    async setStartTimestamp(client, message, args) {
        if (!args[0]) {
            return message.channel.send("> ❌ **Please specify a timestamp.**\nExamples:\n• Unix timestamp: `1640995200000`\n• Relative time: `+1h` (1 hour from now)\n• `now` for current time");
        }

        let timestamp = this.parseTimestamp(args.join(' '));
        if (timestamp === null) {
            return message.channel.send("> ❌ **Invalid timestamp format.**\nUse Unix timestamp (ms), relative time (+1h, +30m), or 'now'");
        }

        const config = client.rpcManager.getCurrentConfig() || this.getDefaultConfig();
        config.rpc.default.timestamps = config.rpc.default.timestamps || {};
        config.rpc.default.timestamps.start = timestamp;
        
        client.rpcManager.updateConfig(config);
        
        const success = await client.rpcManager.updatePresence(client);
        if (success) {
            const date = new Date(timestamp);
            return message.channel.send(`> ✅ **Start timestamp set to: ${date.toLocaleString()}**`);
        }
        return message.channel.send("> ❌ **Failed to update configuration.**");
    },

    async setEndTimestamp(client, message, args) {
        if (!args[0]) {
            return message.channel.send("> ❌ **Please specify a timestamp.**\nExamples:\n• Unix timestamp: `1640995200000`\n• Relative time: `+1h` (1 hour from now)\n• Duration: `30m` (30 minutes from start)");
        }

        let timestamp = this.parseTimestamp(args.join(' '));
        if (timestamp === null) {
            return message.channel.send("> ❌ **Invalid timestamp format.**\nUse Unix timestamp (ms), relative time (+1h, +30m), or duration (30m)");
        }

        const config = client.rpcManager.getCurrentConfig() || this.getDefaultConfig();
        config.rpc.default.timestamps = config.rpc.default.timestamps || {};
        config.rpc.default.timestamps.end = timestamp;
        
        client.rpcManager.updateConfig(config);
        
        const success = await client.rpcManager.updatePresence(client);
        if (success) {
            const date = new Date(timestamp);
            return message.channel.send(`> ✅ **End timestamp set to: ${date.toLocaleString()}**`);
        }
        return message.channel.send("> ❌ **Failed to update configuration.**");
    },

    async viewConfig(client, message) {
        const config = await client.rpcManager.loadConfig() || this.getDefaultConfig();
        
        let viewText = `> **📊 Current RPC Configuration**
>
> **Status:** ${config.rpc.enabled ? "✅ Enabled" : "❌ Disabled"}
>
> **Activity Settings:**`;
        
        const defaultConfig = config.rpc.default || {};
        
        if (defaultConfig.type) viewText += `\n> • **Type:** \`${defaultConfig.type}\``;
        if (defaultConfig.name) viewText += `\n> • **Name:** \`${defaultConfig.name}\``;
        if (defaultConfig.details) viewText += `\n> • **Details:** \`${defaultConfig.details}\``;
        if (defaultConfig.state) viewText += `\n> • **State:** \`${defaultConfig.state}\``;
        if (defaultConfig.url) viewText += `\n> • **URL:** \`${defaultConfig.url}\``;
        
        if (defaultConfig.party && defaultConfig.party.current && defaultConfig.party.max) {
            viewText += `\n> • **Party:** ${defaultConfig.party.current}/${defaultConfig.party.max}`;
        }
        
        if (defaultConfig.timestamps) {
            if (defaultConfig.timestamps.start) {
                const startDate = new Date(defaultConfig.timestamps.start);
                viewText += `\n> • **Start:** ${startDate.toLocaleString()}`;
            }
            if (defaultConfig.timestamps.end) {
                const endDate = new Date(defaultConfig.timestamps.end);
                viewText += `\n> • **End:** ${endDate.toLocaleString()}`;
            }
        }
        
        if (defaultConfig.assets) {
            viewText += `\n>
> **Assets:**`;
            if (defaultConfig.assets.large_image) viewText += `\n> • **Large Image:** \`${defaultConfig.assets.large_image}\``;
            if (defaultConfig.assets.large_text) viewText += `\n> • **Large Text:** \`${defaultConfig.assets.large_text}\``;
            if (defaultConfig.assets.small_image) viewText += `\n> • **Small Image:** \`${defaultConfig.assets.small_image}\``;
            if (defaultConfig.assets.small_text) viewText += `\n> • **Small Text:** \`${defaultConfig.assets.small_text}\``;
        }
        
        if (defaultConfig.assets) {
            viewText += `\n>
> **Assets:**`;
            if (defaultConfig.assets.large_image) viewText += `\n> • **Large Image:** \`${defaultConfig.assets.large_image}\``;
            if (defaultConfig.assets.large_text) viewText += `\n> • **Large Text:** \`${defaultConfig.assets.large_text}\``;
            if (defaultConfig.assets.small_image) viewText += `\n> • **Small Image:** \`${defaultConfig.assets.small_image}\``;
            if (defaultConfig.assets.small_text) viewText += `\n> • **Small Text:** \`${defaultConfig.assets.small_text}\``;
        }
        
        if (defaultConfig.buttons && defaultConfig.buttons.length > 0) {
            viewText += `\n>
> **Buttons:**`;
            defaultConfig.buttons.forEach((btn, i) => {
                viewText += `\n> ${i + 1}. **${btn.label}** → ${btn.url}`;
            });
        } else {
            viewText += `\n>
> **Buttons:** None`;
        }
        
        return message.channel.send(viewText);
    },

    async resetConfig(client, message) {
        try {
            await client.rpcManager.forceReload();
            const freshConfig = await client.rpcManager.loadConfig();
            const applicationId = freshConfig.rpc.application_id || '1306468377539379241';
            await client.rpcManager.ensureAssetsFetched(client, applicationId);
            client.rpcManager.updateConfig(freshConfig);
            const success = await client.rpcManager.updatePresence(client);
            
            if (success) {
                return message.channel.send("> ✅ **RPC configuration reset to file defaults!**");
            }
            return message.channel.send("> ❌ **Failed to reset configuration during presence update.**");
            
        } catch (error) {
            return message.channel.send(`> ❌ **Error during reset:** ${error.message}`);
        }
    },

    async setLargeImage(client, message, args) {
        if (!args[0]) {
            return message.channel.send("> ❌ **Please specify a large image asset name, ID or URL.**\nExamples:\n• Asset name: `Barro`\n• Asset ID: `929325841350000660`\n• Discord URL: `https://cdn.discordapp.com/...`\n• External URL: `https://example.com/image.png`");
        }

        const image = args.join(' ');

        try {
            const config = client.rpcManager.getCurrentConfig() || this.getDefaultConfig();
            const applicationId = config.rpc.application_id || '1306468377539379241';
            
            await client.rpcManager.ensureAssetsFetched(client, applicationId);
            
            config.rpc.default.assets = config.rpc.default.assets || {};
            config.rpc.default.assets.large_image = image;

            client.rpcManager.updateConfig(config);
            
            const success = await client.rpcManager.updatePresence(client);
            if (success) {
                return message.channel.send(`> ✅ **Large image set to: \`${image}\`**`);
            }
            return message.channel.send("> ❌ **Failed to update configuration.**");
            
        } catch (error) {
            return message.channel.send(`> ❌ **Error:** ${error.message}`);
        }
    },

    async setLargeText(client, message, args) {
        if (!args[0]) {
            return message.channel.send("> ❌ **Please specify hover text for the large image.**");
        }

        const text = args.join(' ');

        if (text.length > 128) {
            return message.channel.send("> ❌ **Text too long.** Maximum 128 characters.");
        }

        const config = client.rpcManager.getCurrentConfig() || this.getDefaultConfig();
        config.rpc.default.assets = config.rpc.default.assets || {};
        config.rpc.default.assets.large_text = text;

        client.rpcManager.updateConfig(config);
        
        const success = await client.rpcManager.updatePresence(client);
        if (success) {
            return message.channel.send(`> ✅ **Large image hover text set to: \`${text}\`**`);
        }
        return message.channel.send("> ❌ **Failed to update configuration.**");
    },

    async setSmallImage(client, message, args) {
        if (!args[0]) {
            return message.channel.send("> ❌ **Please specify a small image asset name, ID or URL.**\nExamples:\n• Asset name: `thunder`\n• Asset ID: `895316294222635008`\n• Discord URL: `https://cdn.discordapp.com/...`\n• External URL: `https://example.com/image.png`");
        }

        const image = args.join(' ');

        try {
            const config = client.rpcManager.getCurrentConfig() || this.getDefaultConfig();
            const applicationId = config.rpc.application_id || '1306468377539379241';
            
            await client.rpcManager.ensureAssetsFetched(client, applicationId);
            
            config.rpc.default.assets = config.rpc.default.assets || {};
            config.rpc.default.assets.small_image = image;

            client.rpcManager.updateConfig(config);

            const success = await client.rpcManager.updatePresence(client);
            if (success) {
                return message.channel.send(`> ✅ **Small image set to: \`${image}\`**`);
            }
            return message.channel.send("> ❌ **Failed to update configuration.**");
            
        } catch (error) {
            return message.channel.send(`> ❌ **Error:** ${error.message}`);
        }
    },

    async setSmallText(client, message, args) {
        if (!args[0]) {
            return message.channel.send("> ❌ **Please specify hover text for the small image.**");
        }

        const text = args.join(' ');
        
        if (text.length > 128) {
            return message.channel.send("> ❌ **Text too long.** Maximum 128 characters.");
        }

        const config = client.rpcManager.getCurrentConfig() || this.getDefaultConfig();
        config.rpc.default.assets = config.rpc.default.assets || {};
        config.rpc.default.assets.small_text = text;
        
        client.rpcManager.updateConfig(config);
        
        const success = await client.rpcManager.updatePresence(client);
        if (success) {
            return message.channel.send(`> ✅ **Small image hover text set to: \`${text}\`**`);
        }
        return message.channel.send("> ❌ **Failed to update configuration.**");
    },

    async addButton(client, message, args) {
        if (args.length < 2) {
            return message.channel.send("> ❌ **Usage:** `+rpc addButton <label> <url>`\nExample: `+rpc addButton \"Visit GitHub\" https://github.com/lilbarro/Barro`");
        }

        // Smart parsing: find the URL (must start with http:// or https://)
        let urlIndex = -1;
        for (let i = 0; i < args.length; i++) {
            if (args[i].startsWith('http://') || args[i].startsWith('https://')) {
                urlIndex = i;
                break;
            }
        }

        if (urlIndex === -1) {
            return message.channel.send("> ❌ **Invalid URL format.** Must start with http:// or https://");
        }

        if (urlIndex === 0) {
            return message.channel.send("> ❌ **Please provide a button label before the URL.**");
        }

        // Extract label (everything before the URL)
        const label = args.slice(0, urlIndex).join(' ');
        // Extract URL (everything from URL index onwards)
        const url = args.slice(urlIndex).join(' ');

        if (label.length > 32) {
            return message.channel.send("> ❌ **Button label too long.** Maximum 32 characters.");
        }

        // Validate URL format
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return message.channel.send("> ❌ **Invalid URL format.** Must start with http:// or https://");
        }

        const config = client.rpcManager.getCurrentConfig() || this.getDefaultConfig();
        config.rpc.default.buttons = config.rpc.default.buttons || [];
        
        if (config.rpc.default.buttons.length >= 2) {
            return message.channel.send("> ⚠️ **Maximum 2 buttons allowed.** Use \`+rpc clearButtons\` to remove existing buttons first.");
        }

        config.rpc.default.buttons.push({
            label: label,
            url: url
        });
        
        client.rpcManager.updateConfig(config);
        
        const success = await client.rpcManager.updatePresence(client);
        if (success) {
            return message.channel.send(`> ✅ **Button added: \`${label}\` → \`${url}\`**`);
        }
        return message.channel.send("> ❌ **Failed to update configuration.**");
    },

    async clearButtons(client, message) {
        const config = client.rpcManager.getCurrentConfig() || this.getDefaultConfig();
        config.rpc.default.buttons = [];
        
        client.rpcManager.updateConfig(config);
        
        const success = await client.rpcManager.updatePresence(client);
        if (success) {
            return message.channel.send("> ✅ **All buttons cleared!**");
        }
        return message.channel.send("> ❌ **Failed to update configuration.**");
    },

    getDefaultConfig() {
        return {
            rpc: {
                enabled: true,
                application_id: "1306468377539379241",
                default: {
                    type: "PLAYING",
                    name: "Barro Selfbot",
                    details: "Summoning Silence",
                    state: "github.com/lilbarro",
                    url: "",
                    party: {
                        current: 1,
                        max: 1,
                        id: ""
                    },
                    timestamps: {
                        start: null,
                        end: null
                    },
                    assets: {
                        large_image: "",
                        large_text: "",
                        small_image: "",
                        small_text: ""
                    },
                    buttons: [
                        {
                            label: "GitHub",
                            url: "https://github.com/lilbarro/Barro"
                        },
                        {
                            label: "Support",
                            url: "https://discord.gg/b3hZG4R7Mf"
                        }
                    ],
                    platform: "desktop"
                },
                rate_limits: {
                    max_updates: 5,
                    time_window: 20
                },
                external_assets: {
                    enabled: true,
                    cache_duration: 3600,
                    max_file_size: 5242880
                },
                debug: {
                    enabled: false,
                    log_updates: false,
                    log_assets: false
                }
            }
        };
    },

    parseTimestamp(input) {
        if (input.toLowerCase() === 'now') {
            return Date.now();
        }
        
        const relativeMatch = input.match(/^\+(\d+)([hms])$/i);
        if (relativeMatch) {
            const [, amount, unit] = relativeMatch;
            const multiplier = {
                'h': 60 * 60 * 1000,
                'm': 60 * 1000,
                's': 1000
            }[unit.toLowerCase()];
            return Date.now() + (parseInt(amount) * multiplier);
        }
        
        const durationMatch = input.match(/^(\d+)([hms])$/i);
        if (durationMatch) {
            const [, amount, unit] = durationMatch;
            const multiplier = {
                'h': 60 * 60 * 1000,
                'm': 60 * 1000,
                's': 1000
            }[unit.toLowerCase()];
            return Date.now() + (parseInt(amount) * multiplier);
        }
        
        const timestamp = parseInt(input);
        if (!isNaN(timestamp) && timestamp > 0) {
            return timestamp;
        }
        
        return null;
    }
};