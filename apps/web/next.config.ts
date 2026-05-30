import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.googleadservices.com https://googleads.g.doubleclick.net",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https: wss:",
      "frame-src 'self' https://www.google.com https://googleads.g.doubleclick.net",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
];

const publicCacheHeader = {
  key: "Cache-Control",
  value: "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
};

const privateNoStoreHeader = {
  key: "Cache-Control",
  value: "private, no-cache, no-store, max-age=0, must-revalidate",
};

const publicPageSources = [
  "/",
  "/about",
  "/affiliate-terms",
  "/privacy",
  "/status",
  "/support",
  "/terms",
  "/trending",
  "/niches",
  "/niches/:path*",
  "/30-content-ideas-for-beauty-creators",
  "/30-content-ideas-for-coaches",
  "/30-content-ideas-for-fitness-creators",
  "/30-content-ideas-for-real-estate-agents",
  "/ai-hook-generator",
  "/content-calendar-tool",
  "/creator-content-planner",
  "/free-content-calendar-template",
  "/free-tiktok-hook-ideas",
  "/how-to-find-trends-before-they-blow-up",
  "/instagram-content-ideas",
  "/instagram-reels-hook-ideas",
  "/pinterest-content-ideas",
  "/social-media-content-calendar-template",
  "/tiktok-content-ideas",
  "/tiktok-vs-instagram-reels-content-ideas",
  "/trend-research-tool",
  "/youtube-shorts-hooks",
  "/youtube-shorts-ideas",
];

const privatePageSources = [
  "/admin",
  "/admin/:path*",
  "/alerts",
  "/alerts/:path*",
  "/analytics",
  "/analytics/:path*",
  "/api/:path*",
  "/auth/:path*",
  "/calendar",
  "/calendar/:path*",
  "/dashboard",
  "/dashboard/:path*",
  "/manager",
  "/manager/:path*",
  "/forgot-password",
  "/login",
  "/pricing",
  "/profile",
  "/profile/:path*",
  "/reset-password",
  "/saved",
  "/saved/:path*",
  "/signup",
];

/**
 * Monorepo: trace files from the repository root so serverless bundles resolve
 * correctly when the Vercel "Root Directory" is `apps/web`.
 * Do not set a custom "Output Directory" in the Vercel dashboard for Next.js.
 */
const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "..", ".."),
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      ...publicPageSources.map((source) => ({
        source,
        headers: [publicCacheHeader],
      })),
      ...privatePageSources.map((source) => ({
        source,
        headers: [privateNoStoreHeader],
      })),
    ];
  },
};

export default nextConfig;
