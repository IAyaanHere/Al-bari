/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: {
    // We run linter in scripts and validation phases
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
