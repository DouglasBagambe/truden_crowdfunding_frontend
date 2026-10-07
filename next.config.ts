import type { NextConfig } from "next";

function backendApiOrigin(): string {
  const configured = process.env.BACKEND_API_ORIGIN?.trim();
  if (!configured) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("BACKEND_API_ORIGIN is required in production");
    }
    return (
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ||
      "http://localhost:3000"
    );
  }
  return configured.replace(/\/+$/, "");
}

const nextConfig: NextConfig = {
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
  experimental: {
    webpackBuildWorker: false,
    useTypeScriptCli: false,
  },
  serverExternalPackages: ["viem"],
  async rewrites() {
    const origin = backendApiOrigin();
    return [
      {
        source: "/api/:path*",
        destination: `${origin}/api/:path*`,
      },
    ];
  },
  images: {
    dangerouslyAllowLocalIP: false,
    remotePatterns: [
      ...(() => {
        const url = new URL(backendApiOrigin());
        return [
          {
            protocol: url.protocol.slice(0, -1) as "https" | "http",
            hostname: url.hostname,
            port: url.port,
            pathname: "/api/projects/files/**",
            search: "",
          },
        ];
      })(),
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
