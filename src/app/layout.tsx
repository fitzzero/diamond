import type { Metadata } from 'next';
import ThemeProviders from '@/components/providers/ThemeProviders';
import { AuthProvider } from '@/components/providers/AuthProvider';

// Initialize FontAwesome chess pieces
import '@/lib/fontawesome';

export const metadata: Metadata = {
  title: 'Diamond Chess',
  description:
    'A unique chess variant played on a rotated board with modified pawn mechanics',
  keywords: ['chess', 'game', 'strategy', 'diamond', 'board game'],
  authors: [{ name: 'Diamond Chess Team' }],
  creator: 'Diamond Chess',
  publisher: 'Diamond Chess',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://diamond-chess.vercel.app'),
  openGraph: {
    title: 'Diamond Chess',
    description: 'A unique chess variant played on a rotated board',
    url: 'https://diamond-chess.vercel.app',
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
