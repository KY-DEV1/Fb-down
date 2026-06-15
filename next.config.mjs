/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Docker/Railway deployment
  output: 'standalone',

  // Allow images from external domains (thumbnails)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.fbcdn.net' },
      { protocol: 'https', hostname: '**.facebook.com' },
      { protocol: 'https', hostname: 'scontent**.cdninstagram.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },

  // Increase API body size limit for potential large payloads
  experimental: {
    serverComponentsExternalPackages: ['fluent-ffmpeg'],
  },

  // Custom headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
