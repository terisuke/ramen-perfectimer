import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ラーメン パーフェクトタイマー',
  description: 'カップラーメンのパッケージを撮るだけで、完璧な待ち時間がわかる',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#FF8C00',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-soup-warm">
        <main className="mx-auto max-w-md min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
