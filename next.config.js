/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable server actions for game moves
    serverActions: true,
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
  // Bundle analyzer for production optimization
  webpack: (config, { dev, isServer }) => {
    // Optimize for chess engine calculations
    if (!dev && !isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    return config
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
}

module.exports = nextConfig 