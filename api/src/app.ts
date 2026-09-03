import express from "express";
import cookieParser from "cookie-parser";
import { authRouter } from "./modules/auth/auth.routes.ts";
import { gymsRouter, gymScopedRouter } from "./modules/gyms/gyms.routes.ts";
import { healthRouter } from "./modules/health/health.routes.ts";
import { membersRouter } from "./modules/members/members.routes.ts";
import {
  gymPaymentsRouter,
  memberPaymentsRouter,
} from "./modules/payments/payments.routes.ts";
import {
  memberRemindersRouter,
  remindersRouter,
} from "./modules/reminders/reminders.routes.ts";
import { authenticate } from "./shared/middlewares/authenticate.ts";
import { tenantGuard } from "./shared/middlewares/tenantGuard.ts";
import { errorHandler, notFoundHandler } from "./shared/middlewares/errorHandler.ts";

export function createApp() {
  const app = express();

  app.use(express.json());
  // Needed for the OAuth state cookie that protects against login CSRF.
  app.use(cookieParser());

  // Health checks sit outside /api/v1: they are infrastructure, not product API.
  app.use(healthRouter);

  const v1 = express.Router();

  v1.use("/auth", authRouter);
  // Gym creation: authenticated, but not tenant-guarded - no gym exists yet.
  v1.use("/gyms", gymsRouter);

  /**
   * Everything addressing an existing gym is protected by authenticate +
   * tenantGuard at router level, so a new sub-route cannot accidentally skip
   * tenant isolation. See docs/adr/008-tenant-isolation.md.
   */
  const gymScoped = express.Router({ mergeParams: true });
  gymScoped.use(authenticate, tenantGuard);

  gymScoped.use("/members", membersRouter);
  gymScoped.use("/members/:memberId/payments", memberPaymentsRouter);
  gymScoped.use("/members/:memberId/reminders", memberRemindersRouter);
  gymScoped.use("/payments", gymPaymentsRouter);
  gymScoped.use("/reminders", remindersRouter);
  // Mounted last so /gyms/:gymId itself (GET, PATCH) resolves after the
  // more specific sub-resources above.
  gymScoped.use("/", gymScopedRouter);

  v1.use("/gyms/:gymId", gymScoped);
  app.use("/api/v1", v1);

  // Order matters: 404 first, then the error handler last of all.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
