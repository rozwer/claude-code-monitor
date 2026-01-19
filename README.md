# Claude Code Monitor CLI (Windows)

[![npm version](https://img.shields.io/npm/v/claude-code-monitor.svg)](https://www.npmjs.com/package/claude-code-monitor)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Windows](https://img.shields.io/badge/platform-Windows-blue.svg)](https://www.microsoft.com/windows)

**A CLI tool to monitor multiple Claude Code sessions in real-time from your terminal.**

> **Note**: This is the Windows-native version. For macOS, see the [original repository](https://github.com/onikan27/claude-code-monitor).

---

## 📑 Table of Contents

- [✨ Features](#-features)
- [📋 Requirements](#-requirements)
- [🚀 Installation](#-installation)
- [⚡ Quick Start](#-quick-start)
- [📖 Commands](#-commands)
- [⌨️ Keybindings](#️-keybindings-watch-mode)
- [🎨 Status Icons](#-status-icons)
- [🖥️ Supported Terminals](#️-supported-terminals)
- [💾 Data Storage](#-data-storage)
- [📦 Programmatic Usage](#-programmatic-usage)
- [🔧 Troubleshooting](#-troubleshooting)
- [🔒 Security](#-security)
- [⚠️ Disclaimer](#️-disclaimer)
- [📝 Changelog](#-changelog)
- [📄 License](#-license)

---

## ✨ Features

- 🔌 **Serverless** - File-based session state management (no API server required)
- 🔄 **Real-time** - Auto-updates on file changes
- 🎨 **Simple UI** - Displays only status and directory
- ⚡ **Easy Setup** - One command `ccm` for automatic setup and launch

> **Note**: Terminal focus feature is not available on Windows.

---

## 📋 Requirements

- **Windows 10/11**
- **Node.js** >= 18.0.0
- **Claude Code** installed

---

## 🚀 Installation

### Global install (Recommended)

```powershell
npm install -g claude-code-monitor
```

### Run with npx (no install required)

```powershell
npx claude-code-monitor
```

> **Note**: With npx, you must run `npx claude-code-monitor` each time (the `ccm` shortcut is only available with global install). Global install is recommended since this tool requires hook setup and is designed for continuous use.

---

## ⚡ Quick Start

```powershell
ccm
```

On first run, it automatically sets up hooks and launches the monitor.

---

## 📖 Commands

| Command | Alias | Description |
|---------|-------|-------------|
| `ccm` | - | Launch monitor TUI (auto-setup if not configured) |
| `ccm watch` | `ccm w` | Launch monitor TUI |
| `ccm setup` | - | Configure Claude Code hooks |
| `ccm list` | `ccm ls` | List sessions |
| `ccm clear` | - | Clear all sessions |
| `ccm --version` | `ccm -V` | Show version |
| `ccm --help` | `ccm -h` | Show help |

---

## ⌨️ Keybindings (watch mode)

| Key | Action |
|-----|--------|
| `↑` / `k` | Move up |
| `↓` / `j` | Move down |
| `1-9` | Quick select by number |
| `c` | Clear all sessions |
| `q` / `Esc` | Quit |

> **Note**: Focus feature (Enter/f) is not available on Windows.

---

## 🎨 Status Icons

| Icon | Status | Description |
|------|--------|-------------|
| `●` | Running | Claude Code is processing |
| `◐` | Waiting | Waiting for user input (e.g., permission prompt) |
| `✓` | Done | Session ended |

---

## 🖥️ Supported Terminals

All Windows terminals are supported for monitoring:

| Terminal | Monitoring |
|----------|-----------|
| Windows Terminal | ✅ |
| PowerShell | ✅ |
| Command Prompt | ✅ |
| ConEmu | ✅ |
| Cmder | ✅ |

> **Note**: Terminal focus feature is not available on Windows. You can monitor sessions but cannot auto-switch to specific terminal windows.

---

## 💾 Data Storage

Session data is stored in `~/.claude-monitor/sessions.json`.

### What is stored

| Field | Description |
|-------|-------------|
| `session_id` | Claude Code session identifier |
| `cwd` | Working directory path |
| `tty` | Session identifier (e.g., `win_1234`) |
| `status` | Session status (running/waiting_input/stopped) |
| `updated_at` | Last update timestamp |

Data is automatically removed after 30 minutes of inactivity or when the terminal session ends.

---

## 📦 Programmatic Usage

Can also be used as a library:

```typescript
import { getSessions, getStatusDisplay } from 'claude-code-monitor';

const sessions = getSessions();
for (const session of sessions) {
  const { symbol, label } = getStatusDisplay(session.status);
  console.log(`${symbol} ${label}: ${session.cwd}`);
}
```

---

## 🔧 Troubleshooting

### Sessions not showing

1. Run `ccm setup` to verify hook configuration
2. Check if `~/.claude/settings.json` contains hook settings
3. Restart Claude Code

```powershell
# Check configuration
type %USERPROFILE%\.claude\settings.json | findstr ccm
```

### Reset session data

```powershell
ccm clear
# or
del %USERPROFILE%\.claude-monitor\sessions.json
```

---

## 🔒 Security

- This tool modifies `~/.claude/settings.json` to register hooks
- All data is stored locally; no network requests are made

---

## ⚠️ Disclaimer

This is an unofficial community tool and is not affiliated with, endorsed by, or associated with Anthropic.
"Claude" and "Claude Code" are trademarks of Anthropic.

---

## 📝 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a list of changes.

---

## 📄 License

MIT

---

<p align="center">Made with ❤️ for the Claude Code community</p>
