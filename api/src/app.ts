import express from "express";
import { healthRouter } from "./modules/health/health.routes.ts";
import { membersRouter } from "./modules/members/members.routes.ts";
import { authenticate } from "./shared/middlewares/authenticate.ts";
import { tenantGuard } from "./shared/middlewares/tenantGuard.ts";
import { errorHandler, notFoundHandler } from "./shared/middlewares/errorHandler.ts";

export function createApp() {
  const app = express();

  app.use(express.json());

  // Health checks sit outside /api/v1: they are infrastructure, not product API.
  app.use(healthRouter);

  const v1 = express.Router();

  /**
   * Everything under /gyms/:gymId is protected by authenticate + tenantGuard at
   * router level, so a new sub-route cannot accidentally skip tenant isolation.
   * See docs/adr/008-tenant-isolation.md.
   */
  const gymScoped = express.Router({ mergeParams: true });
  gymScoped.use(authenticate, tenantGuard);
  gymScoped.use("/members", membersRouter);

  v1.use("/gyms/:gymId", gymScoped);
  app.use("/api/v1", v1);

  // Order matters: 404 first, then the error handler last of all.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
