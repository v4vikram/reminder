import type { RequestHandler } from "express";
import { ApiError } from "../utils/apiError.ts";
import { prisma } from "../config/prisma.ts";
import { param } from "../utils/params.ts";

/**
 * Tenant isolation - the most critical security boundary in this application.
 *
 * Verifies that the authenticated user owns the gym named by `:gymId`. It is
 * mounted at router level rather than per route, so everything under
 * `/gyms/:gymId/*` is protected by default and a new route cannot forget it.
 *
 * Rule: never repeat this ownership check inside a controller. Two places to
 * update means one of them eventually goes stale.
 *
 * See docs/adr/008-tenant-isolation.md
 */
export const tenantGuard: RequestHandler = async (req, _res, next) => {
  const user = req.user;
  if (!user) {
    next(ApiError.unauthorized());
    return;
  }

  const gymId = param(req, "gymId");

  const gym = await prisma.gym.findUnique({ where: { id: gymId } });

  // Both "does not exist" and "belongs to someone else" return 403. Returning
  // 404 for the first would leak whether a given gym id exists.
  if (!gym || gym.ownerId !== user.id) {
    next(ApiError.forbidden("You do not have access to this gym"));
    return;
  }

  req.gym = gym;
  next();
};
