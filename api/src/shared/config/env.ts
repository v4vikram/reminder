import "dotenv/config";
import { z } from "zod";

/**
 * Environment variables are validated at boot, not at point of use.
 * A misconfigured app fails to start rather than crashing on the first
 * request that touches a missing variable.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1),

  // Google OAuth (Google Cloud Console -> APIs & Services -> Credentials)
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.url(),

  /** Where the callback sends the browser once a token has been issued. */
  FRONTEND_URL: z.url(),

  // Short secrets are the usual cause of forgeable tokens, so refuse them here
  // rather than trusting whoever writes the deployment config.
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  console.error(`Invalid environment configuration:\n${issues}`);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === "production";
