<div align="center">

<img src="https://cdn.discordapp.com/attachments/1532361087754834026/1532833145534025918/pvd4v04.png?ex=6a6e499c&is=6a6cf81c&hm=78ec2eda33a6c92e4e4661bd88bb324d35b30a8930892bbafc0f5bd1527d661e&" alt="Barro" width="160" height="160" />

# Barro

[![Summoning Silence](https://img.shields.io/badge/SUMMONING-SILENCE-0D0D0D?style=for-the-badge&labelColor=5555FF)](#barro)

[![Discord](https://img.shields.io/badge/DISCORD-JOIN_SERVER-5555FF?style=for-the-badge&labelColor=0D0D0D&logo=discord&logoColor=white)](https://discord.gg/KCchsavsYZ)
[![Node.js](https://img.shields.io/badge/NODE.JS-20+-5555FF?style=for-the-badge&labelColor=0D0D0D&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/LICENSE-MIT-5555FF?style=for-the-badge&labelColor=0D0D0D)](LICENSE)
[![Installation Tutorial](https://img.shields.io/badge/YOUTUBE-INSTALLATION_TUTORIAL-5555FF?style=for-the-badge&labelColor=0D0D0D&logo=youtube&logoColor=white)](https://youtu.be/9iqUyzLRkFQ)

</div>

---

<div align="center">
  <h2>Overview</h2>
</div>

Barro is an experimental, open-source Discord selfbot built with modern JavaScript and `discord.js-selfbot-v13`. It provides a modular command system for utility, media, AI, rich presence, voice-channel, and server-management workflows.

The interface follows a stripped-back terminal style: black space, royal-blue labels, white output, and concise command feedback.

<div align="center">
  <h2>Features</h2>
</div>

- **AI chat:** Ask questions through Groq-powered conversations.
- **Smart replies:** Enable AI responses for DMs, group chats, replies, and mentions.
- **AI AFK mode:** Let the bot reply while you are away and review received messages afterward.
- **Message recovery:** View recently deleted or edited messages and manage cached history.
- **Activity tools:** Record session activity, browse event logs, and use quick lookup utilities.

---

<div align="center">
  <h3>INSTALLATION TUTORIAL</h3>
  <a href="https://www.youtube.com/watch?v=9iqUyzLRkFQ">
    <img src="https://img.youtube.com/vi/9iqUyzLRkFQ/maxresdefault.jpg" alt="Watch the Barro installation tutorial on YouTube" width="640" />
  </a>
</div>

<div align="center">
  <h2>Installation via Git Cloning</h2>
</div>

```bash
git clone https://github.com/lilbarro/Barro
cd Barro
npm install
```
```turning on/off
npm start (to start the bot)
ctrl + c (to stop the bot)
```

Requires Node.js 20 or later.

<div align="center">
  <h2>Configuration</h2>
</div>

Edit `config.yaml` before starting. Set your account token, preferred command prefix, and status. Keep your token private and never commit it to a repository.

```yaml
selfbot:
  token: "YOUR_DISCORD_TOKEN_HERE"
  prefix: ","
  status: dnd
```

<div align="center">
  <h2>Run</h2>
</div>

```bash
npm start
```

For development with the Node inspector:

```bash
npm run dev
```

<div align="center">
  <h2>Commands</h2>
</div>

**AI commands:** `ask`, `aireply`, `aiafk`

**Main commands:** `badreply`, `bang`, `clearsnipe`, `fakedoxx`, `editsnipe`, `fakehack`, `iplookup`, `osint`, `purge`, `ragebait`, `snipe`, `spam`, `stalk`, `viewstalk`

These are the commands available in the AI and Main categories. Barro includes more commands in its other categories; this is only a selection of the usable commands.

<div align="center">
  <h2>Project Layout</h2>
</div>

```text
commands/    Command modules, grouped by category
events/      Discord event handlers
handlers/    Core application handlers
utils/       Shared utilities and managers
docs/        Setup and feature documentation
config.yaml  Runtime configuration
index.js     Application entry point
```

<div align="center">
  <h2>Notice</h2>
</div>

Discord selfbots violate Discord's Terms of Service and can lead to account action. This project is provided for educational purposes only. You are responsible for how you use it.

<div align="center">
  <h2>License</h2>
</div>

Released under the [MIT License](LICENSE).

<div align="center">

`BARRO // SUMMONING SILENCE`
</div>
