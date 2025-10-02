import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Handle .js imports from TypeScript files in workspace packages
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts'],
      '.mjs': ['.mjs', '.mts'],
    };

    // Ensure proper resolution of workspace packages
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
