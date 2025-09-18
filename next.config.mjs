/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Enables static export
  images: { unoptimized: true },  // Disables image optimization for static export
  trailingSlash: true,  // Adds trailing slashes for better Firebase routing
  assetPrefix: '/',  // Root path for assets, compatible with next/font
};

export default nextConfig;  // ES Module export