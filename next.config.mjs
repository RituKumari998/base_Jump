/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable static optimization for pages that use client-side features
  experimental: {
    // This will prevent static generation of pages that use client-side features
    workerThreads: false,
    cpus: 1
  }
};

export default nextConfig;
