import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: ".env.local" });
config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx scripts/seed.ts",
  },
  datasource: {
    // Migrations need a direct (non-pooled) connection; the app itself uses the pooled DATABASE_URL.
    // `prisma generate` doesn't connect, so an empty fallback keeps it working without a .env.
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || "",
  },
});
