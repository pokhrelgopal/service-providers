import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  devIndicators: false,
  // Self-contained server bundle for a slim production Docker image.
  output: "standalone",
  allowedDevOrigins: ["192.168.101.12"],
  // Remote image hosts. MinIO/CDN host is added once presigned uploads land
  // (Milestone 3+); stock hosts are useful for placeholder content meanwhile.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google avatars
      // MinIO (dev) — next/image proxies these server-side so the browser
      // loads them from the app origin instead of hitting MinIO directly.
      { protocol: "http", hostname: "localhost", port: "9004" },
    ],
    // Next 16 blocks optimizing upstreams that resolve to private IPs (SSRF
    // guard). MinIO is on localhost in dev. `next build && next start` runs as
    // NODE_ENV=production, which re-enables the guard and breaks local
    // production builds against local MinIO — so also allow it when the explicit
    // ALLOW_LOCAL_IMAGE_IP flag is set (kept in .env.local, never shipped).
    // Real deployments leave the flag unset and keep the protection.
    dangerouslyAllowLocalIP:
      process.env.NODE_ENV !== "production" ||
      process.env.ALLOW_LOCAL_IMAGE_IP === "true",
  },
};

export default nextConfig;
