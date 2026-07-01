Here is the complete `README.md` enclosed entirely within a single code block so you can copy it with one click:

```markdown
# AniWorld Linux Client

An optimized, feature-rich Electron client for AniWorld built specifically for Linux environments (Arch, CachyOS, Ubuntu, etc.). This client provides a native desktop experience with hardware acceleration, built-in ad-blocking, global shortcuts, and system-level integrations.

## Features

* **Frameless UI & Custom Topbar:** Clean design with a borderless header containing integrated navigation (Back/Forward) and standard window management buttons.
* **Discord Rich Presence (RPC):** Dynamically updates your Discord status with the anime you are currently watching and syncs your activities seamlessly.
* **MPRIS Media Control:** Fully supports native Linux media daemons. Control your playback (Play/Pause) directly via system shortcuts, widgets, or keyboard media keys.
* **Advanced Adblocker Engine:** Injected uBlock and EasyList filter arrays to safely terminate redirect targets, popups, and intrusive iframes.
* **Session Resume Overlay:** Remembers your last watched anime episode and prompts you to continue where you left off when launching the client.
* **Picture-in-Picture (PiP) Mode:** Hit `Alt + P` to toggle a floating, mini-player view that stays always on top.
* **AniSkip Prototype:** Detects standard anime playback timelines and shows a dedicated "Skip Intro" button during the 30 to 90-second mark.
* **Linux HW Acceleration:** Fine-tuned Chromium engine switches for optimal performance using Vaapi Video Decoders on Linux architectures.

## Hotkeys

| Shortcut | Action |
| :--- | :--- |
| `Alt + 🡨` | Navigate Back |
| `Alt + 🡪` | Navigate Forward |
| `Alt + P` | Toggle Picture-in-Picture Mode |
| `F11` | Toggle Fullscreen |

---

## Prerequisites

Ensure you have Node.js, npm, and the necessary system tools installed to compile native dependencies.

For Arch Linux / CachyOS:
```bash
sudo pacman -S nodejs npm base-devel

```

---

## Development & Deployment

### 1. Installation of Dependencies

Clone your repository, navigate to the folder, and install the backend modules:

```bash
npm install
npm install mpris-service

```

### 2. Build Executive Packets

To compile the source files and package them into an independent AppImage and Snap release, run:

```bash
npm run deploy

```

The output binaries will be generated inside the `dist/` directory.

---

## System-Wide Installation

You can use the provided automation scripts to cleanly install or remove the client from your local application desktop hierarchy.

### Install the App:

```bash
chmod +x install.sh uninstall.sh
sudo ./install.sh

```

This moves the AppImage to `/usr/local/share`, creates a global symlink in `/usr/local/bin`, downloads an application icon, and injects a `.desktop` entry so the app shows up in your system launcher menu.

### Uninstall the App:

```bash
sudo ./uninstall.sh

```

This safely purges all installed binaries, tracking symlinks, and desktop entries from your Linux configuration.

```

```