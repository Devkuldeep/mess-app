// Post-build: bundle src/app/sw.ts with Serwist and write public/sw.js.
//
// Why not Serwist's route handler (/serwist/[path])? With cacheComponents on,
// Next ignores its `force-static` config, so it would re-bundle the worker at
// request time — that needs esbuild + source files in production (breaks the
// Docker standalone image). Generating a static file once at build time avoids that.
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { createSerwistRoute } from "@serwist/turbopack";

const revision =
  process.env.SOURCE_COMMIT ||
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ||
  crypto.randomUUID();

const { GET } = createSerwistRoute({
  swSrc: "src/app/sw.ts",
  additionalPrecacheEntries: [
    { url: "/offline", revision },
    { url: "/manifest.webmanifest", revision },
  ],
  useNativeEsbuild: true,
});

const res = await GET(new Request("http://localhost/sw.js"), { params: Promise.resolve({ path: "sw.js" }) });
const body = await res.text();
if (!res.ok || !body.includes("precache")) throw new Error(`Service worker build failed (${res.status})`);
writeFileSync("public/sw.js", body);
console.log(`✓ public/sw.js written (${(body.length / 1024).toFixed(1)} KiB)`);
