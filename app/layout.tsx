import type { Metadata, Viewport } from 'next';
import './globals.css';
import { env } from '@/lib/env';

const SITE_TITLE = 'Geeths Makeover — Bridal & Occasion Makeup, Home Service';
const SITE_DESCRIPTION =
  'Geeths Makeover is a home-service bridal & occasion makeup business. Airbrush HD bridal looks, trials, engagement and party makeup — at your home or venue. Book your appointment online in under a minute.';

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: SITE_TITLE,
    template: '%s · Geeths Makeover',
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: '/',
    siteName: 'Geeths Makeover',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/images/og.jpg',
        width: 1200,
        height: 630,
        alt: 'Geeths Makeover — bridal and occasion makeup, home service',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#faf7f2',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
