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
    // guard). MinIO is on localhost in dev, so allow it there only — prod keeps
    // the protection (MinIO will be a real host then).
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
  },
};

export default nextConfig;
