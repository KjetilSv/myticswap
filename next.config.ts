import type { NextConfig } from 'next';

// Cloudflare Pages friendly: static export (no server runtime needed).
const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
};

export default nextConfig;
