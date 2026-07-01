#!/usr/bin/env bash

set -e

APP_NAME="aniworld-app"
DISPLAY_NAME="AniWorld"
BIN_DIR="/usr/local/bin"
APP_DIR="/usr/local/share/$APP_NAME"
DESKTOP_DIR="/usr/share/applications"
ICON_URL="https://raw.githubusercontent.com/electron/electron/main/docs/assets/images/electron-logo.png"

if [ "$EUID" -ne 0 ]; then
  echo "[-] Please run this script with sudo: sudo ./install.sh"
  exit 1
fi

if [ ! -f "dist/aniworld-app-1.0.0.AppImage" ]; then
  echo "[-] Error: dist/aniworld-app-1.0.0.AppImage not found!"
  echo "[*] Please build the application first using 'npm run deploy'."
  exit 1
fi

echo "[+] Starting installation of $DISPLAY_NAME..."

mkdir -p "$APP_DIR"

echo "[+] Copying AppImage to $APP_DIR..."
cp "dist/aniworld-app-1.0.0.AppImage" "$APP_DIR/$APP_NAME.AppImage"
chmod +x "$APP_DIR/$APP_NAME.AppImage"

echo "[+] Creating symlink in $BIN_DIR..."
ln -sf "$APP_DIR/$APP_NAME.AppImage" "$BIN_DIR/$APP_NAME"

echo "[+] Downloading application icon..."
if command -v curl >/dev/null 2>&1; then
  curl -s -o "$APP_DIR/icon.png" "$ICON_URL"
elif command -v wget >/dev/null 2>&1; then
  wget -q -O "$APP_DIR/icon.png" "$ICON_URL"
else
  echo "[!] Warning: Neither curl nor wget found. Default icon will not be downloaded."
fi

echo "[+] Creating desktop entry under $DESKTOP_DIR..."
cat <<EOF > "$DESKTOP_DIR/$APP_NAME.desktop"
[Desktop Entry]
Name=$DISPLAY_NAME
Exec=$BIN_DIR/$APP_NAME --no-sandbox
Icon=$APP_DIR/icon.png
Type=Application
Categories=Utility;Video;AudioVideo;
Comment=AniWorld Linux Client with Discord RPC and MPRIS
Terminal=false
StartupWMClass=AniWorld
EOF

chmod 644 "$DESKTOP_DIR/$APP_NAME.desktop"

echo "[=======] Installation completed successfully! [=======]"
echo "[*] You can now launch the app from your application menu or via terminal using '$APP_NAME'."