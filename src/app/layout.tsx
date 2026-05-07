import type { Metadata } from 'next';
import { Inter, Bebas_Neue } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-bebas' });

export const metadata: Metadata = {
  metadataBase: new URL('https://verlyn.in'),
  title: 'Verlyn | Zero-Knowledge Social Architecture',
  description:
    'Experience the next generation of private communication. Built on zero-knowledge architecture and end-to-end encryption. Join the elite network.',
  keywords: ['privacy', 'zero-knowledge', 'secure messaging', 'encrypted social network', 'verlyn'],
  openGraph: {
    title: 'Verlyn | The Future of Privacy',
    description:
      'Pre-register for early access to Verlyn. Secure. Private. Sovereign.',
    type: 'website',
    url: 'https://verlyn.in',
    siteName: 'Verlyn',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Verlyn Security' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Verlyn | Private Digital Sovereign',
    description: 'The zero-knowledge social network.',
  },
  alternates: { canonical: 'https://verlyn.in' },
  robots: { index: true, follow: true },
};

export const viewport = {
  themeColor: '#000000',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${bebas.variable} ${inter.className}`}>
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22><path d=%22M17 14 L32 52%22 stroke=%22white%22 stroke-width=%225%22 stroke-linecap=%22round%22/><path d=%22M47 14 L32 52%22 stroke=%22rgba(255,255,255,0.4)%22 stroke-width=%225%22 stroke-linecap=%22round%22/></svg>" />
      </head>
      <body className="bg-black text-white antialiased">{children}</body>
    </html>
  );
}
