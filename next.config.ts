import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
  experimental: {
    webpackBuildWorker: false,
    useTypeScriptCli: false,
  },
  serverExternalPackages: ["viem"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://keibo.onrender.com/api/:path*",
      },
    ];
  },
  images: {
    dangerouslyAllowLocalIP: false,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
