/**
 * lib/ytdlp.js
 * Core wrapper around yt-dlp binary.
 * Handles: URL validation, metadata fetching, format extraction, download streaming.
 */

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import os from 'os';

const execAsync = promisify(exec);

// ─── Resolve yt-dlp binary path ──────────────────────────────────────────────
export function getYtDlpPath() {
  if (process.env.YTDLP_PATH) return process.env.YTDLP_PATH;

  const candidates = [
    path.join(process.cwd(), 'bin', 'yt-dlp'),
    path.join(process.cwd(), 'bin', 'yt-dlp.exe'),
    '/usr/local/bin/yt-dlp',
    '/usr/bin/yt-dlp',
    'yt-dlp', // rely on PATH
  ];

  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {}
  }
  return 'yt-dlp'; // fallback: assume in PATH
}

// ─── Facebook URL validator ───────────────────────────────────────────────────
export function validateFacebookUrl(url) {
  if (!url || typeof url !== 'string') return false;

  const patterns = [
    /^https?:\/\/(www\.)?facebook\.com\/watch/i,
    /^https?:\/\/(www\.)?facebook\.com\/.*\/videos\//i,
    /^https?:\/\/(www\.)?facebook\.com\/reel\//i,
    /^https?:\/\/(www\.)?facebook\.com\/share\/reel\//i,
    /^https?:\/\/(www\.)?facebook\.com\/share\/v\//i,
    /^https?:\/\/(www\.)?facebook\.com\/story\.php/i,
    /^https?:\/\/(www\.)?facebook\.com\/groups\/.+\/permalink\//i,
    /^https?:\/\/fb\.watch\//i,
    /^https?:\/\/m\.facebook\.com\//i,
  ];

  return patterns.some(p => p.test(url.trim()));
}

// ─── Fetch video metadata via yt-dlp --dump-json ─────────────────────────────
export async function fetchVideoInfo(url) {
  const ytdlp = getYtDlpPath();

  const args = [
    '--dump-json',
    '--no-playlist',
    '--no-warnings',
    '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    url,
  ];

  try {
    const { stdout } = await execAsync(
      `"${ytdlp}" ${args.map(a => `"${a}"`).join(' ')}`,
      { timeout: 30_000, maxBuffer: 10 * 1024 * 1024 }
    );

    const data = JSON.parse(stdout);
    return normalizeVideoInfo(data);
  } catch (err) {
    throw new Error(`yt-dlp failed: ${err.message}`);
  }
}

// ─── Normalize raw yt-dlp output into clean shape ────────────────────────────
function normalizeVideoInfo(raw) {
  const formats = (raw.formats || [])
    .filter(f => f.vcodec !== 'none' && f.ext === 'mp4')
    .map(f => ({
      formatId: f.format_id,
      quality: f.height ? `${f.height}p` : f.format_note || 'SD',
      height: f.height || 0,
      width: f.width || 0,
      fps: f.fps || 30,
      ext: f.ext || 'mp4',
      vcodec: f.vcodec || 'h264',
      acodec: f.acodec || 'aac',
      filesize: f.filesize || f.filesize_approx || null,
      tbr: f.tbr || null,
      url: f.url,
    }))
    .sort((a, b) => b.height - a.height);

  // De-duplicate by quality label
  const seen = new Set();
  const uniqueFormats = formats.filter(f => {
    if (seen.has(f.quality)) return false;
    seen.add(f.quality);
    return true;
  });

  // Mark best quality
  if (uniqueFormats.length > 0) uniqueFormats[0].recommended = true;

  // Audio-only formats
  const audioFormats = (raw.formats || [])
    .filter(f => f.vcodec === 'none' && ['m4a', 'mp3', 'aac'].includes(f.ext))
    .map(f => ({
      formatId: f.format_id,
      ext: f.ext,
      abr: f.abr || 128,
      filesize: f.filesize || null,
      url: f.url,
    }))
    .sort((a, b) => (b.abr || 0) - (a.abr || 0));

  return {
    id: raw.id,
    title: raw.title || 'Facebook Video',
    description: raw.description?.slice(0, 200) || '',
    duration: raw.duration || 0,
    durationStr: formatDuration(raw.duration),
    thumbnail: raw.thumbnail || raw.thumbnails?.[0]?.url || null,
    uploader: raw.uploader || 'Facebook User',
    uploadDate: raw.upload_date || null,
    viewCount: raw.view_count || null,
    likeCount: raw.like_count || null,
    formats: uniqueFormats,
    audioFormats,
    webpage_url: raw.webpage_url || raw.original_url,
    isReel: raw.webpage_url?.includes('/reel/') || false,
  };
}

// ─── Stream download via yt-dlp spawn ────────────────────────────────────────
export function createDownloadStream(url, formatId) {
  const ytdlp = getYtDlpPath();

  const args = [
    '-f', formatId,
    '--no-playlist',
    '--no-warnings',
    '-o', '-',            // output to stdout
    '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    url,
  ];

  return spawn(ytdlp, args, { stdio: ['ignore', 'pipe', 'pipe'] });
}

// ─── Audio-only extraction (MP3) via ffmpeg pipe ──────────────────────────────
export function createAudioStream(url) {
  const ytdlp = getYtDlpPath();
  const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';

  const ytdlpArgs = [
    '-f', 'bestaudio',
    '--no-playlist',
    '-o', '-',
    url,
  ];

  const ffmpegArgs = [
    '-i', 'pipe:0',
    '-vn',
    '-acodec', 'libmp3lame',
    '-ab', '128k',
    '-f', 'mp3',
    'pipe:1',
  ];

  const ytdlpProc = spawn(ytdlp, ytdlpArgs, { stdio: ['ignore', 'pipe', 'ignore'] });
  const ffmpegProc = spawn(ffmpegPath, ffmpegArgs, { stdio: ['pipe', 'pipe', 'ignore'] });

  ytdlpProc.stdout.pipe(ffmpegProc.stdin);
  return ffmpegProc.stdout;
}

// ─── Mock data for DEMO_MODE ──────────────────────────────────────────────────
export function getMockVideoInfo(url) {
  const isReel = url.includes('reel') || url.includes('watch');
  return {
    id: 'demo_' + Math.random().toString(36).slice(2, 8),
    title: isReel
      ? 'Aesthetic Morning Routine 2024 ☀️ — Reels #lifestyle'
      : 'Epic 4K Drone Footage — Mountain Landscape Cinematic',
    description: 'Demo mode — install yt-dlp for real downloads.',
    duration: isReel ? 29 : 263,
    durationStr: isReel ? '0:29' : '4:23',
    thumbnail: `https://picsum.photos/seed/${Math.random().toString(36).slice(2,6)}/640/360`,
    uploader: 'Demo Channel',
    uploadDate: '20240901',
    viewCount: 2_400_000,
    likeCount: 48_000,
    formats: [
      { formatId: 'hd', quality: '1080p', height: 1080, width: 1920, fps: 60, ext: 'mp4', vcodec: 'h264', acodec: 'aac', filesize: 148_897_792, tbr: 8200, recommended: true },
      { formatId: 'sd', quality: '720p',  height: 720,  width: 1280, fps: 30, ext: 'mp4', vcodec: 'h264', acodec: 'aac', filesize: 77_594_624,  tbr: 4100 },
      { formatId: 'sd480', quality: '480p', height: 480, width: 854, fps: 30, ext: 'mp4', vcodec: 'h264', acodec: 'aac', filesize: 39_845_888, tbr: 2100 },
      { formatId: 'sd360', quality: '360p', height: 360, width: 640, fps: 30, ext: 'mp4', vcodec: 'h264', acodec: 'aac', filesize: 22_020_096, tbr: 1100 },
    ],
    audioFormats: [
      { formatId: 'audio', ext: 'm4a', abr: 128, filesize: 4_194_304 },
    ],
    webpage_url: url,
    isReel: isReel,
  };
}

// ─── Utils ────────────────────────────────────────────────────────────────────
export function formatDuration(secs) {
  if (!secs) return '—';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
    : `${m}:${String(s).padStart(2,'0')}`;
}

export function formatFileSize(bytes) {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let val = bytes;
  while (val >= 1024 && i < units.length - 1) { val /= 1024; i++; }
  return `${val.toFixed(1)} ${units[i]}`;
}
