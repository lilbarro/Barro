<div align="center">

# BARRO

### The command center for a sharper Discord experience.

<p>
  <strong>AI workflows</strong> &nbsp;·&nbsp;
  <strong>Multi-account control</strong> &nbsp;·&nbsp;
  <strong>Quest automation</strong> &nbsp;·&nbsp;
  <strong>ANSI themes</strong>
</p>

<br />
<br />

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:00c6ff,45:5865f2,100:ff4ecd&height=130&section=header&animation=fadeIn" alt="Barro gradient banner" width="100%" />

</div>

> **Barro is a powerful, highly configurable Discord selfbot control layer for people who want more automation, more intelligence, and less friction.**

It combines a fast prefix-command interface with account-aware settings, layered AI providers, quest tools, profile utilities, presence controls, tracking features, and a vivid ANSI presentation system. Everything runs locally, stays organized in files, and is designed to feel like one coherent product instead of a pile of disconnected scripts.

<div align="center">

[Explore the features](#features) &nbsp; · &nbsp; [Get started](#quick-start) &nbsp; · &nbsp; [Read the docs](#documentation)

</div>

<div align="center">

| <img src="https://img.shields.io/badge/01-00c6ff?style=for-the-badge" alt="01" /> | <img src="https://img.shields.io/badge/02-7c5cff?style=for-the-badge" alt="02" /> | <img src="https://img.shields.io/badge/03-ff4ecd?style=for-the-badge" alt="03" /> | <img src="https://img.shields.io/badge/04-35d07f?style=for-the-badge" alt="04" /> |
| :---: | :---: | :---: | :---: |
| **THINK**<br />AI workflows | **AUTOMATE**<br />Quest tools | **STYLE**<br />ANSI themes | **CONTROL**<br />Account state |

</div>

## Why Barro

Most automation tools make you choose between power and polish. Barro is built to keep both.

- **One command layer:** discoverable prefix commands, aliases, pagination, and consistent output.
- **One control surface:** manage accounts, prefixes, themes, AI providers, presence, and access from one configuration.
- **One local workspace:** JSON-backed state keeps history, memory, backups, and feature data close to the runtime.
- **One visual identity:** ANSI themes let every response match the account using it.

Barro is made to be the most complete control panel in your Discord toolkit: practical for daily workflows, expressive in presentation, and extensible when you want to add another command.

## Features <img src="https://img.shields.io/badge/BUILT%20TO%20STAND%20OUT-ff4ecd?style=flat" alt="Built to stand out" />

### Intelligence that stays useful

<img src="https://img.shields.io/badge/AI%20LAB-7c5cff?style=flat&logo=sparkles&logoColor=white" alt="AI lab" />

Connect the provider that fits the job. Barro supports Groq, Google Gemini, OpenAI, and local Ollama workflows, with configurable models and provider selection.

- Ask questions with `ask` and `aiAsk`
- Enable automatic replies with `aireply`
- Let Barro handle AFK responses with `aiafk`
- Use assistant workflows with `assist`
- Generate images with `imagegen`
- Keep local reply history with `ollamareply`
- Build structured analysis with `dossier`

### Automation without the clutter

<img src="https://img.shields.io/badge/AUTOMATION%20ENGINE-00c6ff?style=flat&logo=zapier&logoColor=white" alt="Automation engine" />

Barro turns repetitive account tasks into short commands with visible state and reusable managers.

- Inspect and complete quests with `quest`
- Monitor Nitro events with `nitrosniper`
- Set global AFK state with `afk`
- Run and stop background tasks
- Apply rate limits to long-running features
- Automatically clean up command output according to command type

### Total account control

<img src="https://img.shields.io/badge/ACCOUNT%20CONTROL-35d07f?style=flat&logo=shield&logoColor=white" alt="Account control" />

Run one account or several. Each configured account can have its own prefix, theme, permissions, and persisted state.

- Per-account prefixes and aliases
- Allow lists and no-prefix access
- Account information and token checks
- Login, logout, restart, and status controls
- Saved presence and custom status workflows
- Rich Presence through `rpc.yml`

### A visual system, not an afterthought

<img src="https://img.shields.io/badge/ANSI%20STUDIO-ff4ecd?style=flat&logo=palette&logoColor=white" alt="ANSI studio" />

Barro's interface is intentionally compact and expressive. Adjust the accent, header, labels, dividers, brand, version, and text colors, then save the result as a reusable preset.

The result is a command experience that looks like yours every time it opens.

### History, context, and visibility

<img src="https://img.shields.io/badge/LOCAL%20MEMORY-f6b73c?style=flat&logo=databricks&logoColor=white" alt="Local memory" />

Keep useful context available without a database or hosted dashboard.

- Avatar, banner, and username history
- Relationship and request utilities
- Stalk, shadow, expose, and dossier records
- AI history and user memory
- Command usage history
- Local backups, debug output, and error logs

## Command Map <img src="https://img.shields.io/badge/EXPLORE%20THE%20STACK-00c6ff?style=flat" alt="Explore the stack" />

Commands are loaded recursively from [`commands/`](commands). Run your configured prefix followed by `help` to see the live menu.

| Area | Key commands |
| --- | --- |
| **AI** | `ask`, `aiAsk`, `aireply`, `aiafk`, `assist`, `dossier`, `imagegen`, `ollamareply` |
| **Automation** | `quest`, `nitrosniper`, `afk`, `todo`, `shortcut`, `page`, `taskStop` |
| **Themes** | `accent`, `header`, `label`, `divider`, `brand`, `text`, `preset`, `version` |
| **Presence** | `status`, `customstatus`, `rpc`, `spoof`, `savepresence` |
| **Profile** | `avatar`, `banner`, `selfinfo`, `history`, `serverinfo`, `hypesquad` |
| **Tracking** | `stalk`, `osint`, `dox`, `iplookup`, `snipe`, `editsnipe` |
| **Social** | `friendlist`, `blocklist`, `ignoredlist`, `outgoingreq`, `upcomingreq` |
| **Voice and fun** | `joinVC`, `leaveVC`, `fakemsg`, `faketyping`, `fakenitro` |
| **Settings** | `prefix`, `allow`, `revoke`, `noprefix`, `backup`, `reload`, `view` |
| **Server actions** | `purge`, `ban100`, `massban`, `nuke`, `ss`, `rc` |

The command folders are the source of truth. Add a command module, restart Barro, and the loader can make it available without rewriting the launcher.

## Quick Start

### Requirements

- Node.js 20 or newer
- A local `config.yaml`
- Valid account configuration
- Optional provider credentials for AI and image generation
- Ollama installed locally for local model workflows

### Install

```powershell
npm install
npm start
```

Before starting:

1. Open [`config.yaml`](config.yaml).
2. Add one or more accounts under `selfbot.accounts`.
3. Set a prefix for each account.
4. Configure only the integrations you intend to use.
5. Keep every token, API key, webhook URL, and wallet address private.

Barro supports two startup styles:

```yaml
terminal:
  startup_mode: direct  # Connect automatically
```

Use `menu` instead of `direct` when you want terminal commands for `login`, `logout`, `restart`, `status`, and `exit`.

## Configuration

The live configuration is [`config.yaml`](config.yaml). Its major sections are:

```yaml
selfbot:             # accounts, prefixes, status, DM logs
terminal:            # direct or menu startup
client_properties:   # client identity settings
logging:             # debug output and category filters
relationship_logs:   # relationship event logging
ai:                  # Groq, Gemini, Ollama, and OpenAI
imagegen:            # Pollinations image generation
ai_afk:              # automated away-message behavior
vc_command:          # voice mute, deafen, and reconnect settings
dossier:             # analysis depth and retention
expose:              # external search settings
shadow:              # tracking delays and follow behavior
```

Rich Presence is configured in [`rpc.yml`](rpc.yml). See [`docs/CONFIG_GUIDE.md`](docs/CONFIG_GUIDE.md) for the complete configuration reference.

## Architecture

```text
index.js                 Runtime entry point and account lifecycle
config.yaml              Main account and feature configuration
rpc.yml                  Rich Presence configuration
commands/                Dynamically discovered command modules
events/                  Discord event listeners
handlers/                Command, event, rate-limit, and crash handling
utils/                   Shared providers, managers, themes, and controllers
data/                    Local JSON state, logs, histories, and backups
docs/                    Feature and setup documentation
```

Barro is intentionally file-backed. Important state is stored locally under [`data/`](data/), including themes, prefixes, allow lists, AI history, assistant memory, relationship logs, tracking records, backups, and debug output.

## Build Something Better

Barro is modular by design. Shared behavior belongs in [`utils/`](utils), command behavior belongs in [`commands/`](commands), and event behavior belongs in [`events/`](events). When you add a feature:

1. Keep account-specific state keyed to the active account.
2. Reuse existing managers for themes, tasks, rate limits, and storage.
3. Keep secrets out of source files and public commits.
4. Run a syntax check before sharing the change.

```powershell
node --check index.js
```

## Safety and policy

Barro uses `discord.js-selfbot-v13`. Discord selfbots are against Discord's Terms of Service and may result in account restrictions or termination. Use Barro only when you understand and accept that risk.

Commands such as `nuke`, `massban`, `ban100`, and `purge` can cause irreversible changes. Use destructive actions only on servers you own or are explicitly authorized to administer.

Never share account tokens, API keys, webhook URLs, wallet addresses, private logs, or generated reports. Rotate a credential immediately if it is exposed.

## Documentation

- [`docs/CONFIG_GUIDE.md`](docs/CONFIG_GUIDE.md) - configuration reference
- [`docs/RPC.md`](docs/RPC.md) - Rich Presence setup
- [`docs/GET_TOKEN.md`](docs/GET_TOKEN.md) - token documentation
- [`docs/ANDROID.md`](docs/ANDROID.md) - Android notes
- [`storage-guide.txt`](storage-guide.txt) - storage ownership and controllers
- [`vencord-plugin/README.md`](vencord-plugin/README.md) - companion plugin notes

## License

Released under the [MIT License](LICENSE).

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:ff4ecd,45:5865f2,100:00c6ff&height=100&section=footer&animation=twinkling" alt="Barro gradient footer" width="100%" />

<sub>BARRO // control the noise</sub>

</div>
