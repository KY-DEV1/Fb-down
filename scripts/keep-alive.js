/**
 * scripts/keep-alive.js
 * Opsional: ping service sendiri setiap 14 menit
 * agar tidak sleep di Render free tier.
 *
 * Cara pakai: jalankan sebagai background process terpisah,
 * atau gunakan layanan eksternal seperti UptimeRobot (gratis).
 *
 * CATATAN: Render melarang ping berlebihan di free tier,
 * jadi lebih disarankan pakai UptimeRobot dari luar.
 */

const https = require('https');
const http  = require('http');

const SERVICE_URL = process.env.RENDER_EXTERNAL_URL || process.env.SERVICE_URL;
const INTERVAL_MS = 14 * 60 * 1000; // 14 menit

if (!SERVICE_URL) {
  console.warn('[keep-alive] SERVICE_URL tidak di-set, script tidak aktif.');
  process.exit(0);
}

function ping() {
  const url = `${SERVICE_URL}/api/health`;
  const client = url.startsWith('https') ? https : http;

  client.get(url, (res) => {
    console.log(`[keep-alive] ${new Date().toISOString()} → ${res.statusCode}`);
  }).on('error', (err) => {
    console.error(`[keep-alive] Error: ${err.message}`);
  });
}

console.log(`[keep-alive] Aktif — ping ke ${SERVICE_URL} setiap 14 menit`);
ping(); // ping langsung saat start
setInterval(ping, INTERVAL_MS);
