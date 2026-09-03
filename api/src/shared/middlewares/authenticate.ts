import type { RequestHandler } from "express";
import { ApiError } from "../utils/apiError.ts";
import { verifyToken } from "../utils/jwt.ts";

/**
 * Verifies the bearer token and attaches the caller to the request.
 *
 * Only the token is trusted here; nothing is read from the database, so this
 * stays a constant-cost check. Whether the user still exists is confirmed
 * where it matters - tenantGuard resolves the gym and its owner anyway.
 */
export const authenticate: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    next(ApiError.unauthorized("Missing Bearer token"));
    return;
  }

  const claims = await verifyToken(header.slice("Bearer ".length).trim());
  req.user = { id: claims.userId, email: claims.email };
  next();
};
