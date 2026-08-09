# ⚙️ Configuration Guide for config.yaml

## 📋 **Important Notes Before Starting**

- **Ignore all comments** - Lines starting with `#` are comments, don't modify them
- **Use double quotes** - Always wrap text values in double quotes `"like this"`
- **Boolean values** - Use `true` or `false` (no quotes needed)
- **Numbers** - Write numbers without quotes
- **Lists** - Use the dash format as shown in examples

---

## 🔧 **Core Selfbot Settings**

### **selfbot section** *(REQUIRED)*

```yaml
selfbot:
  token: "YOUR_DISCORD_TOKEN_HERE"  # REQUIRED - Your Discord token
  prefix: "+"                      # REQUIRED - Command prefix
  status: "dnd"                    # REQUIRED - Your Discord status
  dm_logs: false                   # OPTIONAL - Show DM logs in console
```

#### **Configuration Details:**

- **`token`** *(REQUIRED)*
  - **What it is**: Your Discord account token
  - **How to get**: Follow [GET_TOKEN.md](GET_TOKEN.md) guide
  - **Example**: `"MTEzMjMzODI6DS2MTU1MDYwMw.GqP4rF._h9jUzBCHUynjvdvi76t1sYQRhy1ezYEkz2o3SC"`
  - **⚠️ NEVER share this with anyone!**

- **`prefix`** *(REQUIRED)*
  - **What it is**: Symbol you type before commands
  - **Example**: If prefix is `"+"`, you use `+help`
  - **Recommended**: `"+"`, `"!"`, `"."`, `"$"`

- **`status`** *(REQUIRED)*
  - **What it is**: Your Discord status
  - **Options**: `"online"`, `"idle"`, `"dnd"`, `"invisible"`
  - **Recommended**: `"dnd"` (Do Not Disturb) for selfbots

- **`dm_logs`** *(OPTIONAL)*
  - **What it is**: Show DM messages in console
  - **Options**: `true` or `false`
  - **Default**: `false`

---

## 👥 **Relationship Logging Settings**

### **relationship_logs section** *(OPTIONAL)*

```yaml
relationship_logs:
  enabled: true                    # Enable friend/relationship tracking
  webhook_url: ""                  # Discord webhook for notifications
  special_users:                   # List of users to monitor closely
    - "123456789012345678"         # Replace with actual user IDs
```

#### **Configuration Details:**

- **`enabled`** *(OPTIONAL)*
  - **What it is**: Track friend requests, blocks, etc.
  - **Options**: `true` or `false`
  - **Default**: `true`

- **`webhook_url`** *(OPTIONAL)*
  - **What it is**: Discord webhook URL for notifications
  - **Example**: `"https://discord.com/api/webhooks/123456789/abcdefgh"`
  - **Leave empty** if you don't want webhook notifications

- **`special_users`** *(OPTIONAL)*
  - **What it is**: List of Discord user IDs to monitor closely
  - **How to get user ID**: Right-click user → Copy ID (need Developer Mode enabled)
  - **Example**: `"987654321098765432"`

---

## 🐛 **Debug Settings**

### **debug_mode section** *(OPTIONAL)*

```yaml
debug_mode:
  enabled: false                   # Enable detailed logging
```

#### **Configuration Details:**

- **`enabled`** *(OPTIONAL)*
  - **What it is**: Show detailed debug information
  - **Options**: `true` or `false`
  - **Default**: `false`
  - **⚠️ Only enable when troubleshooting**

---

## 🎮 **Rich Presence (Activity Status)**

> **📋 NOTE:** Rich Presence configuration has been moved to a separate file!
>
> **🎯 New Location:** `rpc.yml` file in the project root
>
> **📖 Complete Guide:** See [RPC.md](RPC.md) for detailed setup instructions
>
> **🚀 Quick Setup:** Use commands like `+rpc enable`, `+rpc setType`, `+rpc setLargeImage`

**The old `rich_presence` section in config.yaml is no longer used.**
**All RPC settings are now managed through the `rpc.yml` file and in-game commands.**

---

## 🤖 **AI Integration**

### **ai section** *(OPTIONAL)*

```yaml
ai:
  groq_api_key: ""                 # Groq API key for AI features
```

#### **Configuration Details:**

- **`groq_api_key`** *(OPTIONAL)*
  - **What it is**: API key for AI-powered commands
  - **How to get**: Visit [console.groq.com](https://console.groq.com/) (100% free)
  - **Example**: `"gsk_abcdefghijklmnopqrstuvwxyz123456"`
  - **Leave empty** if you don't want AI features

---

## 🔊 **Voice Channel Settings**

### **vc_command section** *(OPTIONAL)*

```yaml
vc_command:
  mute: true                       # Auto-mute when joining voice
  deafen: true                     # Auto-deafen when joining voice
  auto_reconnect: true             # Auto-reconnect if disconnected
  reconnect_delay: 5               # Delay before reconnecting (seconds)
  max_attempts: 3                  # Maximum reconnection attempts
```

#### **Configuration Details:**

- **`mute`** *(OPTIONAL)*
  - **What it is**: Automatically mute microphone when joining voice channels
  - **Options**: `true` or `false`
  - **Default**: `true`

- **`deafen`** *(OPTIONAL)*
  - **What it is**: Automatically deafen when joining voice channels
  - **Options**: `true` or `false`
  - **Default**: `true`

- **`auto_reconnect`** *(OPTIONAL)*
  - **What it is**: Automatically reconnect if disconnected from voice
  - **Options**: `true` or `false`
  - **Default**: `true`

- **`reconnect_delay`** *(OPTIONAL)*
  - **What it is**: Seconds to wait before reconnecting
  - **Example**: `5`
  - **Default**: `5`

- **`max_attempts`** *(OPTIONAL)*
  - **What it is**: Maximum number of reconnection attempts
  - **Example**: `3`
  - **Default**: `3`

---

## 💥 **Server Nuke Settings** *(DANGEROUS)*

### **nuke section** *(OPTIONAL)*

```yaml
nuke:
  nuke_message: "@everyone Barro was here! https://github.com/lilbarro/Barro"
  server_name: "Barro owns this server!"
  channels:
    - "Nuked by self"
    - "crushed"
    - "destroyed"
```

#### **Configuration Details:**

- **`nuke_message`** *(OPTIONAL)*
  - **What it is**: Message sent when nuking a server
  - **⚠️ WARNING**: This is for the dangerous `+nuke` command

- **`server_name`** *(OPTIONAL)*
  - **What it is**: New server name after nuking
  - **⚠️ WARNING**: Use responsibly

- **`channels`** *(OPTIONAL)*
  - **What it is**: List of channel names to create after nuking
  - **⚠️ WARNING**: Only use on servers you own or have permission

---

## 💰 **Cryptocurrency Addresses** *(OPTIONAL)*

### **crypto section** *(OPTIONAL)*

```yaml
crypto:
  ltc: ""                          # Litecoin address
  btc: ""                          # Bitcoin address
  sol: ""                          # Solana address
```

#### **Configuration Details:**

- **All crypto fields** *(OPTIONAL)*
  - **What it is**: Your cryptocurrency wallet addresses
  - **Used for**: Donation commands
  - **Leave empty** if you don't want to accept donations

---

## 🔞 **NSFW Content Settings**

### **nsfw section** *(OPTIONAL)*

```yaml
nsfw:
  enabled: false                   # Enable NSFW commands
```

#### **Configuration Details:**

- **`enabled`** *(OPTIONAL)*
  - **What it is**: Enable 18+ content commands
  - **Options**: `true` or `false`
  - **Default**: `false`
  - **⚠️ WARNING**: Only enable if you're 18+ and understand the risks

---

## 🎭 **Troll Commands Settings**

### **bad_phrases section** *(OPTIONAL)*

```yaml
bad_phrases:
  enabled: true                    # Enable troll/insult commands
  phrases:                         # List of phrases for troll commands
    - ""                           # Add your phrases here
    - ""
```

#### **Configuration Details:**

- **`enabled`** *(OPTIONAL)*
  - **What it is**: Enable troll commands like `+badreply`
  - **Options**: `true` or `false`
  - **Default**: `true`

- **`phrases`** *(OPTIONAL)*
  - **What it is**: List of phrases used by troll commands
  - **Format**: Each phrase in double quotes
  - **⚠️ WARNING**: Use responsibly, can contain offensive language

---

## ⚠️ **Advanced Settings** *(DO NOT TOUCH)*

The following sections should **NOT** be modified unless you know what you're doing:

- **`client_properties`** - Browser spoofing settings
- **`api`** - Discord API version settings

**Modifying these can break the selfbot or get you detected faster!**

---

## 📝 **Example Complete Configuration**

```yaml
selfbot:
  token: "YOUR_ACTUAL_DISCORD_TOKEN_HERE"
  prefix: "+"
  status: "dnd"
  dm_logs: false

relationship_logs:
  enabled: true
  webhook_url: ""
  special_users:
    - "123456789012345678"

debug_mode:
  enabled: false

# Rich Presence is now configured in rpc.yml file
# See docs/RPC.md for complete setup guide

ai:
  groq_api_key: "your_groq_key_here"

vc_command:
  mute: true
  deafen: true
  auto_reconnect: true
  reconnect_delay: 5
  max_attempts: 3

nsfw:
  enabled: false

bad_phrases:
  enabled: true
  phrases:
    - "Your custom phrase here"
```

---

## 🆘 **Need Help?**

- **Discord Server**: [Join our support server](https://discord.gg/b3hZG4R7Mf)
- **Token Guide**: [GET_TOKEN.md](GET_TOKEN.md)
- **RPC Guide**: [RPC.md](RPC.md) - Complete Rich Presence setup guide
- **Contact**: `lilbarro` on Discord

---

## ⚠️ **Final Reminders**

1. **Never share your token** with anyone
2. **Use double quotes** for text values
3. **Don't modify advanced settings** unless you're experienced
4. **Test your configuration** before using extensively
5. **Use responsibly** to avoid account termination

**Happy selfbotting! 🤖**