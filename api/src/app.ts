import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { authRouter } from "./modules/auth/auth.routes.ts";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.ts";
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
import { env } from "./shared/config/env.ts";

export function createApp() {
  const app = express();

  /**
   * The frontend is served from a different origin (ADR 001), so browsers
   * block its requests without this. A single explicit origin rather than "*":
   * credentials are required for the OAuth state cookie, and the wildcard is
   * not allowed alongside credentials.
   */
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

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
  gymScoped.use("/dashboard", dashboardRouter);
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
