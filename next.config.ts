import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    // Serve optimized images in modern formats (WebP/AVIF) automatically
    formats: ["image/webp", "image/avif"],
    qualities: [75, 85],
    // Minimum cache TTL for optimised images — 7 days
    minimumCacheTTL: 604800,
    // Reasonable device widths for responsive images (includes common Uganda Android resolutions)
    deviceSizes: [360, 414, 480, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 64, 96, 128, 256, 384],
  },
  transpilePackages: ["mapbox-gl"],

  // Compiler optimisations
  compiler: {
    // Remove console.log in production (keep console.error / console.warn)
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },
};

// Wrap with Sentry only when auth token is configured (CI/CD deploys).
// Without the token, source maps aren't uploaded but runtime monitoring still works.
const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN;

export default SENTRY_AUTH_TOKEN
  ? withSentryConfig(nextConfig, {
      org:     process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: SENTRY_AUTH_TOKEN,
      silent: true,
      disableLogger: true,
      automaticVercelMonitors: false,
    })
  : nextConfig;
