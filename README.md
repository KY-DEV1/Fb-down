# FBDrop — Facebook Video & Reels Downloader
### Next.js 14 Full Stack · App Router · yt-dlp backend

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![yt-dlp](https://img.shields.io/badge/yt--dlp-latest-red)](https://github.com/yt-dlp/yt-dlp)

---

## 🚀 Quick Start

```bash
# 1. Clone & install
git clone <your-repo>
cd fbdrop
npm install           # also auto-downloads yt-dlp binary

# 2. Configure environment
cp .env.local .env.local.bak   # it's already pre-configured
# Edit .env.local and set DEMO_MODE=false when ready

# 3. Run dev server
npm run dev           # http://localhost:3000
```

```
# CMD sekali jalan
  bash scripts/install-deps.sh && npm ci && npm run build

````
## 📁 Project Structure

```
fbdrop/
├── app/
│   ├── layout.jsx              # Root layout + metadata
│   ├── page.jsx                # Main UI (Client Component)
│   ├── globals.css             # Design system CSS variables
│   └── api/
│       ├── fetch-video/
│       │   └── route.js        # POST /api/fetch-video
│       └── download/
│           └── route.js        # GET  /api/download (stream)
├── components/
│   ├── Toast.jsx               # Global toast notification system
│   ├── ProgressSteps.jsx       # Animated progress indicator
│   ├── QualityGrid.jsx         # Quality selector + download buttons
│   └── HistoryPanel.jsx        # Download history (localStorage)
├── lib/
│   ├── ytdlp.js                # yt-dlp wrapper: fetch info, stream download
│   └── rateLimit.js            # In-memory IP rate limiter
├── scripts/
│   └── download-ytdlp.js       # Auto-downloads yt-dlp binary on postinstall
├── bin/                        # yt-dlp binary lives here (auto-created)
├── .env.local                  # Environment config
└── next.config.mjs
```

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DEMO_MODE` | `true` | Use mock data (no real yt-dlp calls) |
| `YTDLP_PATH` | auto-detect | Path to yt-dlp binary |
| `FFMPEG_PATH` | `ffmpeg` | Path to ffmpeg (for MP3 extraction) |
| `MAX_FILE_SIZE_MB` | `500` | Max allowed download size |
| `RATE_LIMIT_RPM` | `10` | Max API requests per IP per minute |

---

## 🔌 API Reference

### `POST /api/fetch-video`
Fetch video metadata.

**Request body:**
```json
{ "url": "https://www.facebook.com/watch?v=..." }
```

**Response:**
```json
{
  "success": true,
  "demo": true,
  "data": {
    "id": "...",
    "title": "Video Title",
    "thumbnail": "https://...",
    "duration": 263,
    "durationStr": "4:23",
    "uploader": "Channel Name",
    "viewCount": 2400000,
    "isReel": false,
    "formats": [
      {
        "formatId": "hd",
        "quality": "1080p",
        "height": 1080,
        "fps": 60,
        "ext": "mp4",
        "filesize": 148897792,
        "filesizeHuman": "142.0 MB",
        "recommended": true
      }
    ],
    "audioFormats": [
      { "formatId": "audio", "ext": "m4a", "abr": 128 }
    ]
  }
}
```

### `GET /api/download`
Stream download to browser.

**Query params:**
| Param | Description |
|---|---|
| `url` | Facebook video URL |
| `formatId` | Format ID from `/api/fetch-video` |
| `filename` | Output filename (without extension) |
| `type` | `video` or `audio` |

---

## 🛠 Production Setup

### 1. Install yt-dlp on your server
```bash
# Linux/macOS
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
chmod +x /usr/local/bin/yt-dlp

# Verify
yt-dlp --version
```

### 2. Install ffmpeg (for MP3 audio)
```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg
```

### 3. Update .env.local
```env
DEMO_MODE=false
YTDLP_PATH=/usr/local/bin/yt-dlp
FFMPEG_PATH=/usr/bin/ffmpeg
RATE_LIMIT_RPM=10
```

### 4. Deploy to Vercel
```bash
npm run build
vercel --prod
```
> ⚠️ **Note:** Vercel serverless functions have a 60s timeout. For large files or slow connections, consider deploying to a VPS (Railway, Render, DigitalOcean) instead.

---

## 📋 Supported URL Formats

- `https://www.facebook.com/watch?v=VIDEO_ID`
- `https://www.facebook.com/USERNAME/videos/VIDEO_ID`
- `https://www.facebook.com/reel/VIDEO_ID`
- `https://www.facebook.com/share/reel/VIDEO_ID`
- `https://fb.watch/SHORTCODE`
- `https://m.facebook.com/...`

---

## 🔐 Rate Limiting

- `/api/fetch-video`: 10 requests/minute per IP
- `/api/download`: 5 requests/minute per IP

For production, replace in-memory rate limiting with Redis using `@upstash/ratelimit`.

---

## ⚖️ Legal Notice

This tool is for **personal use and backup only**. Always respect Facebook's Terms of Service and the copyright of content creators. Do not use this to redistribute or monetize others' content.

---

## 🧩 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| UI | React 18 (Client Components) |
| Styling | CSS Variables (no Tailwind) |
| Download Engine | yt-dlp |
| Audio Conversion | ffmpeg |
| Rate Limiting | In-memory Map |
| Deployment | Vercel / Node.js server |
