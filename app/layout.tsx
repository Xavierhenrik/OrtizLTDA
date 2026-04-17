import type { Metadata } from 'next';
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
    icon: '/logo-ortizltda.png',
    apple: '/logo-ortizltda.png',
  },
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
      <body>{children}</body>
    </html>
  );
}
