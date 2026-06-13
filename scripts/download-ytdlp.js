/**
 * scripts/download-ytdlp.js
 * Automatically downloads the yt-dlp binary on postinstall.
 * Run: node scripts/download-ytdlp.js
 */

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const BIN_DIR = path.join(__dirname, '..', 'bin');
const RELEASES_URL = 'https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest';

const ASSET_MAP = {
  linux:  { asset: 'yt-dlp',         chmod: true  },
  darwin: { asset: 'yt-dlp_macos',   chmod: true  },
  win32:  { asset: 'yt-dlp.exe',     chmod: false },
};

function httpsGet(url, options = {}) {
  return new Promise((resolve, reject) => {
    const opts = { ...options, headers: { 'User-Agent': 'fbdrop-installer', ...(options.headers || {}) } };
    https.get(url, opts, res => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        return httpsGet(res.headers.location, options).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  const platform = process.platform;
  const info = ASSET_MAP[platform];
  if (!info) {
    console.log(`[yt-dlp] Unsupported platform: ${platform}. Install yt-dlp manually.`);
    return;
  }

  const binPath = path.join(BIN_DIR, info.asset);

  if (fs.existsSync(binPath)) {
    console.log(`[yt-dlp] Binary already exists at ${binPath}`);
    return;
  }

  if (!fs.existsSync(BIN_DIR)) fs.mkdirSync(BIN_DIR, { recursive: true });

  console.log('[yt-dlp] Fetching latest release info...');
  const relJson = JSON.parse(await httpsGet(RELEASES_URL));
  const asset   = relJson.assets?.find(a => a.name === info.asset);

  if (!asset) {
    console.warn(`[yt-dlp] Asset "${info.asset}" not found in latest release.`);
    return;
  }

  console.log(`[yt-dlp] Downloading ${asset.name} v${relJson.tag_name}...`);
  const binary = await httpsGet(asset.browser_download_url);

  fs.writeFileSync(binPath, binary);
  if (info.chmod) fs.chmodSync(binPath, '755');

  console.log(`[yt-dlp] Saved to ${binPath} ✓`);
}

main().catch(err => {
  console.warn('[yt-dlp] Auto-download failed:', err.message);
  console.warn('[yt-dlp] Install manually: https://github.com/yt-dlp/yt-dlp#installation');
});
