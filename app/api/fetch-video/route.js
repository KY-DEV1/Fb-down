/**
 * app/api/fetch-video/route.js
 * POST /api/fetch-video
 * Body: { url: string }
 * Returns: VideoInfo object or error
 */

import { NextResponse } from 'next/server';
import {
  validateFacebookUrl,
  fetchVideoInfo,
  getMockVideoInfo,
  formatFileSize,
} from '../../../lib/ytdlp';
import { rateLimit } from '../../../lib/rateLimit';

const DEMO_MODE = process.env.DEMO_MODE !== 'false';

export async function POST(request) {
  // ── Rate limiting ──────────────────────────────────────
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? '127.0.0.1';
  const limit = rateLimit(ip, {
    limit: parseInt(process.env.RATE_LIMIT_RPM || '10'),
    windowMs: 60_000,
  });

  if (!limit.ok) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Retry in ${limit.retryAfter}s.` },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
    );
  }

  // ── Parse body ────────────────────────────────────────
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { url } = body;

  if (!url) {
    return NextResponse.json({ error: 'URL is required.' }, { status: 400 });
  }

  // ── Validate URL ──────────────────────────────────────
  if (!validateFacebookUrl(url)) {
    return NextResponse.json(
      { error: 'Invalid Facebook URL. Supported: facebook.com/watch, /reel/, fb.watch' },
      { status: 422 }
    );
  }

  // ── Fetch info ────────────────────────────────────────
  try {
    const info = DEMO_MODE ? getMockVideoInfo(url) : await fetchVideoInfo(url);

    // Attach human-readable file sizes
    info.formats = info.formats.map(f => ({
      ...f,
      filesizeHuman: formatFileSize(f.filesize),
    }));

    if (info.audioFormats) {
      info.audioFormats = info.audioFormats.map(f => ({
        ...f,
        filesizeHuman: formatFileSize(f.filesize),
      }));
    }

    return NextResponse.json(
      { success: true, data: info, demo: DEMO_MODE },
      {
        status: 200,
        headers: {
          'X-RateLimit-Remaining': String(limit.remaining),
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (err) {
    console.error('[fetch-video]', err.message);

    // Friendly error messages
    if (err.message.includes('Private video')) {
      return NextResponse.json({ error: 'This video is private or requires login.' }, { status: 403 });
    }
    if (err.message.includes('not found') || err.message.includes('removed')) {
      return NextResponse.json({ error: 'Video not found or has been removed.' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch video. Make sure the URL is public and try again.' },
      { status: 500 }
    );
  }
}
