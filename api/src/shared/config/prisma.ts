import { PrismaClient } from "../../../generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { env, isProduction } from "./env.ts";

/**
 * Prisma 7 requires a driver adapter for SQL databases; the native engine
 * binary was removed. We use `adapter-pg` rather than `adapter-neon` because
 * this backend is a long-running process, not an edge runtime, so a standard
 * TCP connection pool is the better fit.
 *
 * See docs/adr/004-prisma-adapter-pg.md
 */
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

export const prisma = new PrismaClient({
  adapter,
  log: isProduction ? ["error"] : ["warn", "error"],
});
