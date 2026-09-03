import { Router } from "express";
import { prisma } from "../../shared/config/prisma.ts";
import { ok } from "../../shared/utils/response.ts";

export const healthRouter: Router = Router();

/** Liveness: the process is up. */
healthRouter.get("/health", (_req, res) => {
  res.json(ok({ status: "ok", uptime: process.uptime() }));
});

/** Readiness: the database is reachable too. */
healthRouter.get("/health/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json(ok({ status: "ready", database: "connected" }));
  } catch {
    res.status(503).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Database is not reachable" },
    });
  }
});
