# 🚀 Panduan Deploy FBDrop ke Render

## Prasyarat
- Akun GitHub (gratis)
- Akun Render (gratis) → https://render.com

---

## Langkah 1 — Push ke GitHub

```bash
# Di folder fbdrop
git init
git add .
git commit -m "feat: initial FBDrop setup"

# Buat repo baru di github.com, lalu:
git remote add origin https://github.com/USERNAME/fbdrop.git
git push -u origin main
```

---

## Langkah 2 — Buat Web Service di Render

1. Login ke **https://dashboard.render.com**
2. Klik **"New +"** → **"Web Service"**
3. Pilih **"Build and deploy from a Git repository"**
4. Connect repo GitHub kamu → pilih repo `fbdrop`
5. Isi form:

| Field | Value |
|---|---|
| **Name** | `fbdrop` |
| **Region** | `Singapore` (terdekat dari Indonesia) |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `bash scripts/install-deps.sh && npm ci && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

---

## Langkah 3 — Set Environment Variables

Di halaman Web Service → tab **"Environment"** → tambahkan:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DEMO_MODE` | `false` |
| `YTDLP_PATH` | `./bin/yt-dlp` |
| `FFMPEG_PATH` | `ffmpeg` |
| `RATE_LIMIT_RPM` | `10` |
| `MAX_FILE_SIZE_MB` | `500` |

---

## Langkah 4 — Deploy

Klik **"Create Web Service"** → Render akan otomatis:
1. Clone repo dari GitHub
2. Jalankan `scripts/install-deps.sh` (install ffmpeg + yt-dlp)
3. Build Next.js
4. Jalankan server di port 3000

Tunggu ~3–5 menit. Setelah selesai, kamu dapat URL seperti:
```
https://fbdrop.onrender.com
```

---

## Langkah 5 — Verifikasi

Buka URL health check:
```
https://fbdrop.onrender.com/api/health
```

Harusnya muncul response seperti ini:
```json
{
  "status": "ok",
  "demo_mode": false,
  "binaries": {
    "ytdlp":  { "ok": true, "version": "2024.xx.xx" },
    "ffmpeg": { "ok": true, "version": "ffmpeg version 6.x" }
  }
}
```

Kalau `ytdlp.ok` = `true` → download beneran sudah aktif! ✅

---

## Opsional — Hindari Sleep (Gratis)

Free tier Render tidur setelah 15 menit idle. Untuk mencegahnya
(tanpa bayar), daftar **UptimeRobot** (gratis):

1. Buka https://uptimerobot.com → daftar gratis
2. Klik **"Add New Monitor"**
3. Pilih **HTTP(s)**
4. URL: `https://fbdrop.onrender.com/api/health`
5. Interval: **5 minutes**
6. Save

UptimeRobot akan ping service-mu setiap 5 menit, sehingga tidak pernah sleep.

---

## Auto-Deploy

Setiap kali kamu `git push` ke branch `main`, Render otomatis
rebuild dan redeploy. Zero downtime deploy sudah aktif by default.

---

## Troubleshoot

### Build gagal di step ffmpeg
Tambahkan environment variable:
```
APT_PACKAGES=ffmpeg
```
Render mendukung variabel ini untuk install apt package secara native.

### yt-dlp error "Video unavailable"
- Pastikan URL Facebook-nya **public** (bukan private/friends only)
- Coba update yt-dlp: jalankan manual deploy ulang dari dashboard

### Cold start lambat (~60 detik)
Normal untuk free tier. Gunakan UptimeRobot (lihat langkah opsional di atas).

### Port error
Pastikan Start Command menggunakan: `npm start`
Dan `package.json` punya: `"start": "next start -p ${PORT:-3000}"`
Render inject `$PORT` otomatis.
