import type { NextConfig } from 'next';

// Cloudflare Pages friendly: static export (no server runtime needed).
const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },

  // Allow LAN testing of `next dev` without Next blocking HMR/resources.
  // Add any other local IPs you use.
  allowedDevOrigins: ['192.168.86.27', 'localhost', '127.0.0.1'],
};

export default nextConfig;
