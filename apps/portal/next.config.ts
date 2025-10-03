import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },

  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts'],
      '.mjs': ['.mjs', '.mts'],
    };

    config.resolve.symlinks = false;

    return config;
  },
  transpilePackages: [
    '@tenderd-fms/core-types',
    '@tenderd-fms/api-client',
    '@tenderd-fms/websocket-client',
  ],
};

export default nextConfig;
