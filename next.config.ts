import type { NextConfig } from "next";

const LEGACY_API_BASE_URL =
  process.env.LEGACY_API_BASE_URL ??
  process.env.NEXT_PUBLIC_LEGACY_API_BASE_URL ??
  "https://antarestar-dashboard.vercel.app";
const LEGACY_API_DESTINATION_BASE = LEGACY_API_BASE_URL.replace(/\/$/, "");

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  async rewrites() {
    return [
      {
        source: "/legacy-api/:path*",
        destination: `${LEGACY_API_DESTINATION_BASE}/:path*`,
      },
    ];
  },
};

export default nextConfig;
