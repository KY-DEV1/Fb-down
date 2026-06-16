import './globals.css';

export const metadata = {
  title: 'FBDrop — Facebook Video & Reels Downloader',
  description: 'Download Facebook videos, Reels, and Watch content in HD, SD, or audio-only. Free, fast, no login, no watermarks.',
  keywords: ['facebook downloader', 'reels downloader', 'fb video download', 'download facebook video', 'facebook mp3'],
  authors: [{ name: 'FBDrop' }],
  openGraph: {
    title: 'FBDrop — Facebook Video & Reels Downloader',
    description: 'Download Facebook videos & Reels in HD — free, fast, no login.',
    type: 'website',
    images: [{ url: '/og-image.svg', width: 1200, height: 630, alt: 'FBDrop' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FBDrop — Facebook Video Downloader',
    description: 'Download Facebook videos & Reels in HD — free and fast.',
    images: ['/og-image.svg'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    apple: '/favicon.svg',
  },
  themeColor: '#5b72f8',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml"/>
        <link rel="icon" href="/favicon.ico" sizes="32x32"/>
        <meta name="theme-color" content="#5b72f8"/>
      </head>
      <body>{children}</body>
    </html>
  );
}
