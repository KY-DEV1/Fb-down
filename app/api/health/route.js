/**
 * app/api/health/route.js
 * GET /api/health
 * Render menggunakan endpoint ini untuk cek apakah service hidup.
 * Juga mengecek ketersediaan yt-dlp dan ffmpeg.
 */

import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { getYtDlpPath } from '../../../lib/ytdlp';

export const dynamic = 'force-dynamic';

function checkBinary(cmd) {
  try {
    const out = execSync(`${cmd} --version 2>&1`, { timeout: 5000 }).toString().trim();
    return { ok: true, version: out.split('\n')[0] };
  } catch {
    return { ok: false, version: null };
  }
}

export async function GET() {
  const ytdlp  = checkBinary(getYtDlpPath());
  const ffmpeg = checkBinary(process.env.FFMPEG_PATH || 'ffmpeg');
  const demo   = process.env.DEMO_MODE !== 'false';

  const status = {
    status:    'ok',
    timestamp: new Date().toISOString(),
    demo_mode: demo,
    runtime:   process.version,
    binaries: {
      ytdlp:  ytdlp,
      ffmpeg: ffmpeg,
    },
  };

  // Kalau bukan demo mode tapi yt-dlp tidak ada, return warning
  const httpStatus = (!demo && !ytdlp.ok) ? 503 : 200;

  return NextResponse.json(status, { status: httpStatus });
}
