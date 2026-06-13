import './globals.css';

export const metadata = {
  title: 'FBDrop — Facebook Video & Reels Downloader',
  description: 'Download Facebook videos, Reels, and Watch content in HD, SD, or audio-only. Free, fast, no watermarks.',
  keywords: ['facebook downloader', 'reels downloader', 'fb video download', 'download facebook video'],
  openGraph: {
    title: 'FBDrop — Facebook Video Downloader',
    description: 'Download Facebook videos & Reels in HD — free and fast.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
