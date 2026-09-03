import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { ApiError } from "../utils/apiError.ts";

type Target = "body" | "query" | "params";

/**
 * Validates a request against a Zod schema and writes the parsed value back,
 * so controllers receive typed, coerced data.
 *
 * Validation lives in middleware rather than controllers so every endpoint
 * produces the same 400 envelope and controllers stay focused on flow.
 */
export function validate(schema: ZodType, target: Target = "body"): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join(".") || target,
        message: issue.message,
      }));
      next(ApiError.validation("Invalid request data", details));
      return;
    }

    // In Express 5 req.query is getter-only, so assign via defineProperty.
    Object.defineProperty(req, target, { value: result.data, writable: true });
    next();
  };
}
