/// <reference lib="esnext" />
/// <reference lib="webworker" />
// Service worker (Serwist). Bundled to public/sw.js after `next build` by
// scripts/build-sw.ts. See CLAUDE.md → "Offline architecture".
import { defaultCache, PAGES_CACHE_NAME } from "@serwist/turbopack/worker";
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import { ExpirationPlugin, NetworkFirst, NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

const WEEK = 7 * 24 * 60 * 60;
const isProd = process.env.NODE_ENV === "production";

// Checked before Serwist's defaults. Pages are network-first with a short
// timeout so a delivery boy on 2G gets the cached copy fast, and kept for a
// week (defaults: no timeout for navigations, 1 day).
const pageRules: RuntimeCaching[] = isProd
  ? [
      // Never cache our API: /api/export is a private data dump and /api/sync
      // must always hit the server. (Serwist's defaults cache GET /api/*.)
      {
        matcher: ({ sameOrigin, url }) => sameOrigin && url.pathname.startsWith("/api/"),
        handler: new NetworkOnly(),
      },
      {
        matcher: ({ request, sameOrigin, url }) =>
          sameOrigin && request.mode === "navigate" && !url.pathname.startsWith("/api/"),
        handler: new NetworkFirst({
          cacheName: PAGES_CACHE_NAME.html,
          networkTimeoutSeconds: 4,
          plugins: [new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: WEEK })],
        }),
      },
      {
        matcher: ({ request, sameOrigin, url }) =>
          sameOrigin && request.headers.get("RSC") === "1" && !url.pathname.startsWith("/api/"),
        handler: new NetworkFirst({
          cacheName: PAGES_CACHE_NAME.rsc,
          networkTimeoutSeconds: 4,
          plugins: [new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: WEEK })],
        }),
      },
    ]
  : [];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [...pageRules, ...defaultCache],
  fallbacks: {
    entries: [{ url: "/offline", matcher: ({ request }) => request.destination === "document" }],
  },
});

// Logout on a shared phone: forget every cached page (they contain the
// previous user's data). Sent by clearOfflinePages() in app-runtime.tsx.
const PRIVATE_CACHES = [PAGES_CACHE_NAME.html, PAGES_CACHE_NAME.rsc, PAGES_CACHE_NAME.rscPrefetch, "others", "apis"];
self.addEventListener("message", (event) => {
  if (event.data === "clear-pages") {
    event.waitUntil(Promise.all(PRIVATE_CACHES.map((name) => caches.delete(name))));
  }
});

serwist.addEventListeners();
