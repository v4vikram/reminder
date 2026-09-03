import type { RequestHandler } from "express";
import { env, isProduction } from "../../shared/config/env.ts";
import { ApiError } from "../../shared/utils/apiError.ts";
import { ok } from "../../shared/utils/response.ts";
import * as service from "./auth.service.ts";

const STATE_COOKIE = "oauth_state";
const STATE_TTL_MS = 10 * 60 * 1000;

/**
 * Starts the OAuth flow.
 *
 * The state value is both sent to Google and stored in a short-lived httpOnly
 * cookie. On the way back the two must match, which is what stops an attacker
 * from feeding the user a callback URL for an account the user does not own
 * (login CSRF). SameSite=Lax still arrives on the top-level redirect back.
 */
export const startGoogleOAuth: RequestHandler = (_req, res) => {
  const state = service.createOAuthState();

  res.cookie(STATE_COOKIE, state, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: STATE_TTL_MS,
    path: "/api/v1/auth",
  });

  res.redirect(service.buildAuthUrl(state));
};

export const handleGoogleCallback: RequestHandler = async (req, res) => {
  const { code, state } = req.query;
  const expectedState = req.cookies?.[STATE_COOKIE] as string | undefined;

  res.clearCookie(STATE_COOKIE, { path: "/api/v1/auth" });

  if (typeof code !== "string" || typeof state !== "string") {
    throw ApiError.validation("Missing code or state in the OAuth callback");
  }
  if (!expectedState || expectedState !== state) {
    throw ApiError.unauthorized("OAuth state mismatch; restart the sign-in flow");
  }

  const profile = await service.exchangeCodeForProfile(code);
  const user = await service.findOrCreateUser(profile);
  const token = await service.issueSessionToken(user);

  // The token goes back in the URL fragment, not the query string: fragments
  // are never sent to servers, kept out of access logs and stripped from the
  // Referer header. An httpOnly cookie would be stronger still, but the API
  // contract is Bearer-based - revisit together, not halfway.
  res.redirect(`${env.FRONTEND_URL}/auth/callback#token=${encodeURIComponent(token)}`);
};

export const getCurrentUser: RequestHandler = async (req, res) => {
  res.json(ok(await service.getCurrentUser(req.user!.id)));
};

/**
 * Logout is client-side: the token is stateless, so the client discards it.
 * Kept as an endpoint so the contract has an explicit place to grow into once
 * refresh tokens and server-side revocation exist.
 */
export const logout: RequestHandler = (_req, res) => {
  res.status(204).send();
};
