import type { Metadata } from 'next';
import ThemeProviders from '@/components/providers/ThemeProviders';
import { AuthProvider } from '@/components/providers/AuthProvider';

// Initialize FontAwesome chess pieces
import '@/lib/fontawesome';

export const metadata: Metadata = {
  title: 'Diamond Chess',
  description: 'Random chess variants',
  icons: '/icon.png',
  keywords: ['chess', 'game', 'strategy', 'diamond', 'board game'],
  authors: [{ name: 'Diamond Chess Team' }],
  creator: 'Diamond Chess',
  publisher: 'Diamond Chess',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://chess.logan.gg'),
  openGraph: {
    title: 'Diamond Chess',
    description: 'Random chess variants',
    url: 'https://chess.logan.gg',
    siteName: 'Diamond Chess',
    locale: 'en_US',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Diamond Chess',
    description: 'A unique chess variant played on a rotated board',
  },
  verification: {
    google: 'google-site-verification-token',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProviders>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProviders>
      </body>
    </html>
  );
}
