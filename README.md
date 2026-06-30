# AniWorld Linux App (v1.0.0)

A high-performance, native Linux desktop application for AniWorld.to, optimized for Arch Linux and CachyOS. Features an integrated uBlock Origin adblocking engine, Discord Rich Presence integration, and custom media navigation controls.

## Features
* **Advanced Adblocker:** Implements native ElectronBlocker instances to terminate malicious redirects, inline frame exploits, and video player popups directly at the network layer.
* **Dark Splashscreen:** A dedicated, frameless loading environment initialized during filter compilation to prevent white window flashing on startup.
* **Discord RPC:** Automatic synchronization with local IPC sockets to display current media metadata on your profile.
* **Media Navigation:** Injected global shortcut bindings for quick history navigation via `Alt + Left` / `Alt + Right`.
* **State Persistence:** Window size and coordinate parameters are cached locally to preserve layout across sessions.

---

## Installation & Deployment

You can compile and deploy the application locally via the command-line interface.

### 1. Clone the Repository
```bash
git clone https://github.com/hakuxyz/aniworld-app.git
cd aniworld-app
