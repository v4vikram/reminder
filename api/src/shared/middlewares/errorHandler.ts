import type { ErrorRequestHandler, RequestHandler } from "express";
import { ApiError, ErrorCode } from "../utils/apiError.ts";
import { isProduction } from "../config/env.ts";

/** Any unmatched route becomes a 404 in the same envelope as every other error. */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

/**
 * All errors funnel through here, so the response shape is identical
 * everywhere and stack traces never reach the client.
 *
 * Express 5 forwards rejected promises from async handlers automatically,
 * so no asyncHandler wrapper is needed.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.status).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  // Reaching here means an unexpected error. Log it rather than swallowing it.
  console.error("Unhandled error:", err);

  res.status(500).json({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: "Something went wrong",
      // Surface the real message in development only, never in production.
      ...(isProduction ? {} : { details: [{ field: "_", message: String(err) }] }),
    },
  });
};
