import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 输出模式 - Windows 构建时禁用 standalone 以避免 symlink 权限问题
  output: 'standalone',
  transpilePackages: [
    '@apartment-ultra/api-contract',
    '@apartment-ultra/shared-ui',
    '@apartment-ultra/web-api-client',
  ],
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
      '.cjs': ['.cts', '.cjs'],
    };

    return config;
  },
};

export default withPWA(nextConfig);
