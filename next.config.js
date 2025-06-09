/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable React strict mode to prevent double initialization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ethereum.org',
        port: '',
        pathname: '/static/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Fallbacks for client-side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    
    // Handle potential module issues
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    
    return config;
  },
  // Suppress hydration warnings during development
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Improve performance
  swcMinify: true,
};

module.exports = nextConfig; 