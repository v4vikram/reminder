import type { RequestHandler } from "express";
import { ApiError } from "../utils/apiError.ts";
import { isProduction } from "../config/env.ts";
import { prisma } from "../config/prisma.ts";

/**
 * STUB - real authentication is not implemented yet.
 *
 * Google Sign-In (docs/adr/006) needs an OAuth consent screen configured in
 * Google Cloud Console, which is a manual setup step. Until that exists this
 * stub treats the first user in the database as the caller, so the members
 * module can be exercised end to end.
 *
 * It deliberately fails in production: if this is ever deployed by accident,
 * the app refuses the request rather than silently letting everyone in.
 */
export const authenticate: RequestHandler = async (req, _res, next) => {
  if (isProduction) {
    next(
      new ApiError(
        "INTERNAL_ERROR",
        "The authentication stub cannot run in production; implement real Google Sign-In first",
      ),
    );
    return;
  }

  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });

  if (!user) {
    next(
      ApiError.unauthorized(
        "No user exists in the database. Seed one before using the authentication stub.",
      ),
    );
    return;
  }

  req.user = { id: user.id, email: user.email };
  next();
};
