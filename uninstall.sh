#!/usr/bin/env bash

set -e

APP_NAME="aniworld-app"
BIN_DIR="/usr/local/bin"
APP_DIR="/usr/local/share/$APP_NAME"
DESKTOP_DIR="/usr/share/applications"

if [ "$EUID" -ne 0 ]; then
  echo "[-] Please run this script with sudo: sudo ./uninstall.sh"
  exit 1
fi

echo "[+] Starting uninstallation of $APP_NAME..."

if [ -f "$BIN_DIR/$APP_NAME" ]; then
  echo "[+] Removing symlink from $BIN_DIR..."
  rm -f "$BIN_DIR/$APP_NAME"
fi

if [ -d "$APP_DIR" ]; then
  echo "[+] Removing application files from $APP_DIR..."
  rm -rf "$APP_DIR"
fi

if [ -f "$DESKTOP_DIR/$APP_NAME.desktop" ]; then
  echo "[+] Removing desktop entry..."
  rm -f "$DESKTOP_DIR/$APP_NAME.desktop"
fi

echo "[=======] Uninstallation completed successfully! [=======]"