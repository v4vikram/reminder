import crypto from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import type { User } from "../../../generated/prisma/client.ts";
import { prisma } from "../../shared/config/prisma.ts";
import { env } from "../../shared/config/env.ts";
import { ApiError } from "../../shared/utils/apiError.ts";
import { signToken } from "../../shared/utils/jwt.ts";

const oauthClient = new OAuth2Client({
  clientId: env.GOOGLE_CLIENT_ID,
  clientSecret: env.GOOGLE_CLIENT_SECRET,
  redirectUri: env.GOOGLE_CALLBACK_URL,
});

/** Random value tying the callback back to the browser that started the flow. */
export function createOAuthState(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function buildAuthUrl(state: string): string {
  return oauthClient.generateAuthUrl({
    scope: ["openid", "email", "profile"],
    state,
    // No refresh token is needed: Google is only used to establish identity
    // once, after which our own session token takes over.
    access_type: "online",
    // Owners may have several Google accounts; never silently reuse one.
    prompt: "select_account",
  });
}

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

/**
 * Exchanges the authorization code for an ID token and validates it.
 *
 * verifyIdToken checks the signature against Google's published keys plus the
 * issuer, audience and expiry. Decoding the token without verifying would let
 * anyone mint an identity, so this step is not optional.
 */
export async function exchangeCodeForProfile(code: string): Promise<GoogleProfile> {
  const { tokens } = await oauthClient.getToken(code);

  if (!tokens.id_token) {
    throw ApiError.unauthorized("Google did not return an ID token");
  }

  const ticket = await oauthClient.verifyIdToken({
    idToken: tokens.id_token,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    throw ApiError.unauthorized("Google profile is missing an id or email");
  }

  // An unverified email would let someone claim an address they do not own.
  if (payload.email_verified === false) {
    throw ApiError.forbidden("This Google account has an unverified email address");
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name ?? payload.email.split("@")[0] ?? "Gym Owner",
    ...(payload.picture ? { avatarUrl: payload.picture } : {}),
  };
}

/**
 * Finds or creates the user for a Google profile.
 *
 * Matched on googleId, not email: an email can change on the Google account
 * while the subject id stays stable, so keying on email would silently create
 * a duplicate user when someone updates their address.
 */
export async function findOrCreateUser(profile: GoogleProfile): Promise<User> {
  const existing = await prisma.user.findUnique({ where: { googleId: profile.googleId } });

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        email: profile.email,
        name: profile.name,
        ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
      },
    });
  }

  return prisma.user.create({
    data: {
      googleId: profile.googleId,
      email: profile.email,
      name: profile.name,
      ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
    },
  });
}

export async function issueSessionToken(user: User): Promise<string> {
  return signToken({ userId: user.id, email: user.email });
}

/** Current user plus their gyms; an empty list means onboarding is still pending. */
export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { gyms: { orderBy: { createdAt: "asc" } } },
  });

  if (!user) throw ApiError.unauthorized("User no longer exists");

  const { gyms, ...rest } = user;
  return {
    user: {
      id: rest.id,
      email: rest.email,
      name: rest.name,
      avatarUrl: rest.avatarUrl,
      createdAt: rest.createdAt.toISOString(),
    },
    gyms,
  };
}
