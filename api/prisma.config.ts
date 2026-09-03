// Prisma 7 configuration.
//
// From v7 the datasource URL no longer lives in the schema file; it belongs
// here. Prisma does not load .env by itself, hence the explicit dotenv import.
//
// This file configures the Prisma CLI (migrate, studio) only. At runtime,
// PrismaClient is constructed with the @prisma/adapter-pg driver adapter -
// see src/shared/config/prisma.ts and docs/adr/004-prisma-adapter-pg.md.

import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
