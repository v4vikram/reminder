import type { Request } from "express";
import { ApiError } from "./apiError.ts";

/**
 * Reads a route parameter as a string.
 *
 * Express 5 types params as `string | string[]`, because wildcard and repeated
 * segments can yield arrays. Our routes only declare single-value params, so
 * anything else is a programming error rather than user input - but narrowing
 * here keeps that assumption explicit instead of casting it away.
 */
export function param(req: Request, name: string): string {
  const value = req.params[name];

  if (typeof value !== "string" || value.length === 0) {
    throw ApiError.validation(`Missing or invalid route parameter: ${name}`);
  }

  return value;
}
