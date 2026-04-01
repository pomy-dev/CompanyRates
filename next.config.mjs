/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove `output: 'export'` for server-side routes (API, Supabase admin) to work.
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

export default nextConfig;
