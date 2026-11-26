import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations need a direct (non-pooled) connection. Neon on Vercel provides
    // DATABASE_URL_UNPOOLED; elsewhere DATABASE_URL is used. The app itself
    // always connects with DATABASE_URL (src/server/db.ts).
    url: process.env["DATABASE_URL_UNPOOLED"] || process.env["DATABASE_URL"],
    // Only needed for servers that can't create a temp database (e.g. `prisma dev`).
    shadowDatabaseUrl: process.env["SHADOW_DATABASE_URL"] || undefined,
  },
});
