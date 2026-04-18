import type { Metadata, Viewport } from 'next';
import { AccessibilityToolbar } from '@/components/accessibility-toolbar';
import { VlibrasWidget } from '@/components/vlibras-widget';
import { AccessibilityProvider } from '@/lib/accessibility-context';
import { Inter, Montserrat } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['700', '900'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Ortiz Ltda — Construção Civil',
  description: 'Tradição e precisão em construção de madeira',
  icons: {
    icon: '/logo-construtora-ortiz.png',
    apple: '/logo-construtora-ortiz.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${montserrat.variable}`}>
      <head>
        <link rel="stylesheet" href="/style.css" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css"
        />
      </head>
      <body>
        <AccessibilityProvider>
          {children}
          <AccessibilityToolbar />
        </AccessibilityProvider>
        <VlibrasWidget />
      </body>
    </html>
  );
}
