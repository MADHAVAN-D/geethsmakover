import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // better-sqlite3 is a native module — keep it out of webpack's bundle.
  serverExternalPackages: ['better-sqlite3'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.sanitycdn.com',
      },
    ],
    deviceSizes: [448, 640, 750, 828, 1080, 1200, 1600, 2048],
  },
};

export default nextConfig;
