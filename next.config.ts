import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Standalone server bundle for the Docker production image.
  output: "standalone",
  experimental: {
    // Keep navigations / Server Actions pending while offline and retry on
    // reconnect; enables `useOffline()` from "next/offline".
    useOffline: true,
  },
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    // The service worker must never be served from HTTP cache, or updates stall.
    return [{ source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] }];
  },
};

// withSerwist marks esbuild as a server external (it bundles src/app/sw.ts).
export default withSerwist(nextConfig);
