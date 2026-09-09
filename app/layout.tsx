import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FONOTAP | Tu música, en sus manos',
  description: 'Tarjetas inteligentes NFC y QR para artistas.',
  manifest: '/manifest.json',
  themeColor: '#9333ea',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FONOTAP',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#9333ea" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="bg-[#0a0a0a] text-white antialiased">
        {children}
      </body>
    </html>
  );
}