import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Standalone server bundle for the Docker image; Vercel builds its own output.
  output: process.env.VERCEL ? undefined : "standalone",
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
  // /learn reads docs/work-flow-story/*.md (src/server/learn.ts). Pages prerender at
  // build time; this also ships the files with the server in case one renders later.
  outputFileTracingIncludes: {
    "/learn": ["./docs/work-flow-story/**/*.md"],
    "/learn/*": ["./docs/work-flow-story/**/*.md"],
  },
  async headers() {
    // The service worker must never be served from HTTP cache, or updates stall.
    return [{ source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] }];
  },
};

// withSerwist marks esbuild as a server external (it bundles src/app/sw.ts).
export default withSerwist(nextConfig);
