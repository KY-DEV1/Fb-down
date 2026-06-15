# 🚂 Panduan Deploy FBDrop ke Railway

## Kenapa Railway?
- ✅ **Tidak perlu kartu kredit** — gratis $5 credit langsung
- ✅ **No sleep** — service tetap hidup terus (selama credit ada)
- ✅ **Support yt-dlp & ffmpeg** — persistent server, bukan serverless
- ✅ **Deploy dari GitHub** — auto-deploy setiap `git push`

---

## Langkah 1 — Push ke GitHub

```bash
cd fbdrop
git init
git add .
git commit -m "feat: FBDrop Railway ready"

# Buat repo baru di github.com, lalu:
git remote add origin https://github.com/USERNAME/fbdrop.git
git push -u origin main
```

---

## Langkah 2 — Daftar & Deploy di Railway

1. Buka **https://railway.app** → klik **"Start a New Project"**
2. Pilih **"Deploy from GitHub repo"**
3. Login dengan GitHub → authorize Railway
4. Pilih repo `fbdrop`
5. Railway otomatis deteksi Next.js dan mulai build

---

## Langkah 3 — Set Environment Variables

Di Railway dashboard → pilih service `fbdrop` → tab **"Variables"** → tambahkan:

```
NODE_ENV          = production
DEMO_MODE         = false
YTDLP_PATH        = ./bin/yt-dlp
FFMPEG_PATH       = ffmpeg
RATE_LIMIT_RPM    = 10
MAX_FILE_SIZE_MB  = 500
```

Klik **"Deploy"** setelah set variables.

---

## Langkah 4 — Set Custom Domain (Opsional)

Railway kasih domain gratis format:
```
fbdrop-production.up.railway.app
```

Atau bisa connect domain sendiri di tab **"Settings" → "Domains"**.

---

## Langkah 5 — Verifikasi

Buka health check:
```
https://fbdrop-production.up.railway.app/api/health
```

Response yang benar:
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

---

## Estimasi Penggunaan $5 Credit

Railway charge berdasarkan resource yang dipakai:

| Resource | Usage | Estimasi/bulan |
|---|---|---|
| CPU (0.5 vCPU idle) | ~$0.5–1.0 | Tergantung traffic |
| RAM (512MB) | ~$1.0–1.5 | Fixed |
| Bandwidth | $0.10/GB | Tergantung download |

**Estimasi kasar:** $5 credit bisa tahan **1–3 bulan** untuk project personal dengan traffic rendah.

Setelah credit habis, service akan **suspended** (tidak dicharge lebih).
Isi ulang credit mulai dari $5 kapan pun kamu mau.

---

## Auto-Deploy

Setiap `git push` ke branch `main` → Railway otomatis rebuild & deploy.

```bash
# Contoh update code
git add .
git commit -m "fix: something"
git push   # ← Railway langsung deploy ulang
```

---

## Troubleshoot

### Build error: yt-dlp download gagal
Railway mungkin blokir outbound ke GitHub saat build.
Solusi: set environment variable `DEMO_MODE=true` sementara,
lalu coba deploy ulang.

### Error: Cannot find module
Pastikan `npm ci` berjalan (bukan `npm install`).
Railway biasanya handle ini otomatis via Nixpacks.

### Port error / service tidak jalan
Pastikan Start Command adalah `npm start`.
Railway inject `$PORT` otomatis, dan package.json sudah
dikonfigurasi dengan `next start -p ${PORT:-3000}`.

### Credit habis duluan
Kurangi memory usage dengan set di Railway dashboard:
- Memory limit: 512 MB
- CPU limit: 0.5 vCPU
