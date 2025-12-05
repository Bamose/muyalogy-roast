import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RoastBot',
  description: 'Telegram roast bot built with Next.js + Vercel AI SDK'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
