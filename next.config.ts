import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A lockfile in a parent folder confuses root detection; pin it to this project.
  outputFileTracingRoot: process.cwd(),
  images: {
    // Keep in sync with IMAGE_HOSTS in src/lib/images.ts
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
    // Low-RAM machines: `LOW_MEM_BUILD=1 npm run build` avoids spawning parallel build workers.
    ...(process.env.LOW_MEM_BUILD ? { cpus: 1 } : {}),
  },
};

export default nextConfig;
