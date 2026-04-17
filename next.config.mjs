import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

function supabaseImageRemotePatterns() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return [];
  try {
    const host = new URL(base).hostname;
    return [
      {
        protocol: 'https',
        hostname: host,
        pathname: '/storage/v1/object/public/**',
      },
    ];
  } catch {
    return [];
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: supabaseImageRemotePatterns(),
  },
};

export default nextConfig;
