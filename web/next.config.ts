import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Repo root also has a package-lock.json (the Action/CLI package), which
  // makes Next.js misdetect the workspace root — pin it explicitly to web/.
  turbopack: {
    root: path.join(process.cwd()),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
