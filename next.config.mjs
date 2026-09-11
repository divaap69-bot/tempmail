/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  turbopack: {},
  // Mark node:sqlite as external so it's not bundled by Turbopack/webpack
  serverExternalPackages: [],
  experimental: {
    // Allow node: protocol imports on the server
  },
};

export default nextConfig;
