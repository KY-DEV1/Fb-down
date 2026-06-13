#!/usr/bin/env bash
# scripts/install-deps.sh
# Dijalankan saat build di Render untuk install ffmpeg dan yt-dlp.
# Render menggunakan Ubuntu/Debian, jadi apt tersedia.

set -e  # exit on any error

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  FBDrop — Dependency Installer"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── ffmpeg ────────────────────────────────────────────────
echo ""
echo "▶ Installing ffmpeg..."

if command -v ffmpeg &> /dev/null; then
  echo "  ✓ ffmpeg already installed: $(ffmpeg -version 2>&1 | head -1)"
else
  apt-get update -qq
  apt-get install -y -qq ffmpeg
  echo "  ✓ ffmpeg installed: $(ffmpeg -version 2>&1 | head -1)"
fi

# ── yt-dlp ───────────────────────────────────────────────
echo ""
echo "▶ Installing yt-dlp..."

BIN_DIR="$(pwd)/bin"
YTDLP_BIN="$BIN_DIR/yt-dlp"

mkdir -p "$BIN_DIR"

if [ -f "$YTDLP_BIN" ]; then
  echo "  ✓ yt-dlp already exists, updating..."
fi

# Download latest yt-dlp binary
curl -sSL \
  "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp" \
  -o "$YTDLP_BIN"

chmod +x "$YTDLP_BIN"

echo "  ✓ yt-dlp installed: $($YTDLP_BIN --version)"

# ── Summary ───────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  All dependencies ready ✓"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
