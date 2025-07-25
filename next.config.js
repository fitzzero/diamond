/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Server actions are enabled by default in Next.js 14+
    // serverActions: true, // No longer needed
  },
  // Optimize images for chess pieces and board
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
    ],
  },
  // Enable strict mode for better development experience
  reactStrictMode: true,
  // Environment variables that should be available on the client side
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_DESCRIPTION: process.env.NEXT_PUBLIC_APP_DESCRIPTION,
  },
  // Reduce logging noise in development
  logging: {
    fetches: {
      fullUrl: false, // Don't log full URLs
    },
  },
  // Bundle analyzer for production optimization
  webpack: (config, { dev, isServer }) => {
    // Optimize for chess engine calculations
    if (!dev && !isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }

    // Reduce polling-related console noise in development
    if (dev && !isServer) {
      config.infrastructureLogging = {
        level: 'error',
      };
    }

    return config;
  },
  // Enable source maps in development
  ...(process.env.NODE_ENV === 'development' && {
    typescript: {
      // Ignore TypeScript errors during build in development
      ignoreBuildErrors: false,
    },
    eslint: {
      // Warning: This allows production builds to successfully complete even if
      // your project has ESLint errors.
      ignoreDuringBuilds: false,
    },
  }),
};

module.exports = nextConfig;
