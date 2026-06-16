/**
 * app/api/download/route.js
 * GET /api/download?url=...&formatId=...&filename=...&type=video|audio
 * Streams the video/audio directly to the client.
 */

import { NextResponse } from 'next/server';
import { validateFacebookUrl, createDownloadStream, createAudioStream } from '../../../lib/ytdlp';
import { rateLimit } from '../../../lib/rateLimit';
import { Readable } from 'stream';

const DEMO_MODE = process.env.DEMO_MODE !== 'false';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const formatId = searchParams.get('formatId') || 'best';
  const filename = searchParams.get('filename') || 'video';
  const type = searchParams.get('type') || 'video'; // 'video' | 'audio'

  // ── Rate limiting ──────────────────────────────────────
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? '127.0.0.1';
  const limit = rateLimit(ip, { limit: 5, windowMs: 60_000 }); // stricter for downloads
  if (!limit.ok) {
    return new NextResponse('Rate limit exceeded.', { status: 429 });
  }

  // ── Validate ──────────────────────────────────────────
  if (!url || !validateFacebookUrl(url)) {
    return new NextResponse('Invalid URL.', { status: 400 });
  }

  // ── Demo mode: redirect to sample file ───────────────
  if (DEMO_MODE) {
    const sampleUrl = type === 'audio'
      ? 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
      : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

    return NextResponse.redirect(sampleUrl);
  }

  // ── Real download via yt-dlp ──────────────────────────
  try {
    const safeFilename = filename.replace(/[^a-z0-9_\-\s]/gi, '_').slice(0, 100);
    const ext = type === 'audio' ? 'mp3' : 'mp4';
    const contentType = type === 'audio' ? 'audio/mpeg' : 'video/mp4';

    const proc = type === 'audio'
      ? null // handle separately below
      : createDownloadStream(url, formatId);

    const outputStream = type === 'audio'
      ? createAudioStream(url)
      : proc.stdout;

    // Convert Node.js stream to Web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        outputStream.on('data', chunk => controller.enqueue(chunk));
        outputStream.on('end', () => controller.close());
        outputStream.on('error', err => {
          console.error('[download stream error]', err.message);
          controller.error(err);
        });
      },
      cancel() {
        if (proc) proc.kill('SIGTERM');
      },
    });

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${safeFilename}.${ext}"`,
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    console.error('[download]', err.message);
    return new NextResponse('Download failed.', { status: 500 });
  }
}
