#!/usr/bin/env bash
# scripts/install-deps.sh
# Compatible dengan Railway (Nixpacks) dan Render (Debian/apt).
# ffmpeg sudah tersedia via nixpacks.toml di Railway,
# script ini hanya perlu download yt-dlp binary.

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  FBDrop — Dependency Installer"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── ffmpeg (hanya install via apt jika belum ada) ─────────
echo ""
echo "▶ Checking ffmpeg..."
if command -v ffmpeg &> /dev/null; then
  echo "  ✓ ffmpeg: $(ffmpeg -version 2>&1 | head -1)"
else
  echo "  → ffmpeg not found, trying apt..."
  if command -v apt-get &> /dev/null; then
    apt-get update -qq && apt-get install -y -qq ffmpeg
    echo "  ✓ ffmpeg installed via apt"
  else
    echo "  ⚠ Cannot install ffmpeg (no apt). Audio-only download disabled."
  fi
fi

# ── yt-dlp ───────────────────────────────────────────────
echo ""
echo "▶ Installing yt-dlp..."

BIN_DIR="$(pwd)/bin"
YTDLP_BIN="$BIN_DIR/yt-dlp"

mkdir -p "$BIN_DIR"

curl -sSL \
  "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp" \
  -o "$YTDLP_BIN"

chmod +x "$YTDLP_BIN"
echo "  ✓ yt-dlp: $($YTDLP_BIN --version)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  All dependencies ready ✓"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
