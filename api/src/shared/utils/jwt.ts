import { SignJWT, jwtVerify } from "jose";
import { env } from "../config/env.ts";
import { ApiError } from "./apiError.ts";

/**
 * Session tokens.
 *
 * `jose` rather than `jsonwebtoken`: this project is ESM ("type": "module"),
 * jose is ESM-native with a promise API and no CommonJS interop friction.
 *
 * Tokens are stateless, so logout cannot revoke them server-side - the client
 * discards the token instead. Acceptable while sessions are short-lived and
 * there is one user per gym; a refresh-token flow with server-side revocation
 * is listed as deferred work in docs/api-contract.md §6.
 */
const secret = new TextEncoder().encode(env.JWT_SECRET);
const ALGORITHM = "HS256";

export interface TokenClaims {
  userId: string;
  email: string;
}

export async function signToken(claims: TokenClaims): Promise<string> {
  return new SignJWT({ email: claims.email })
    .setProtectedHeader({ alg: ALGORITHM })
    .setSubject(claims.userId)
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<TokenClaims> {
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: [ALGORITHM] });

    if (!payload.sub || typeof payload.email !== "string") {
      throw ApiError.unauthorized("Token is missing required claims");
    }

    return { userId: payload.sub, email: payload.email };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    // Expired, tampered with, wrong algorithm - all indistinguishable to the
    // caller on purpose, so the response cannot be used to probe the secret.
    throw ApiError.unauthorized("Invalid or expired token");
  }
}
