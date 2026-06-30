### Aniworld Linux 1.0

A high-performance, native Linux desktop application for AniWorld.to, optimized for Arch Linux and CachyOS. Features an integrated uBlock Origin adblocking engine, Discord Rich Presence integration, custom media navigation controls, and an intelligent session-resume system.

## Key Features

* **Advanced Adblocker:** Implements native ElectronBlocker instances to terminate malicious redirects, inline frame exploits, and video player popups directly at the network layer.
* **Terminal-Style Splashscreen:** A dedicated, frameless loading environment that provides real-time, color-coded logging during application startup.
* **Session Resume System:** Automatically detects your last watched content and offers a seamless "Want to continue?" notification on launch with a 10-second auto-expiry progress bar.
* **Discord RPC:** Automatic synchronization with local IPC sockets to display your current anime and episode status on your profile.
* **Navigation & PiP:** Global shortcut bindings:
    * `Alt + Left/Right`: Browser navigation.
    * `Alt + P`: Toggle Picture-in-Picture mode (Always-on-Top).
    * `F11`: True fullscreen.

---

## Installation & Deployment

### 1. Prerequisites
Ensure you have `nodejs` and `npm` installed.

On Arch/CachyOS:
```bash
sudo pacman -S nodejs npm

```

### 2. Clone & Setup

```bash
git clone [https://github.com/hakuxyz/aniworld-app.git](https://github.com/hakuxyz/aniworld-app.git)
cd aniworld-app
npm install

```

### 3. Compilation & Deployment

The app uses a dedicated deployment script defined in `package.json` to compile the source, clean up old binaries, and register the app in your system's application launcher.

To build and deploy the app locally to your user directory:

```bash
npm run deploy

```

*For future updates, simply run `npm run deploy` inside the project folder to refresh the installation.*

---

## Contributing

The project is optimized for performance-heavy Linux environments. Feel free to submit pull requests for better filter lists or UI enhancements.

```
