import type { NextConfig } from "next";

/**
 * Security headers.
 *
 * Neither Next.js nor Vercel sends these by default, so without this block the
 * deployed app ships with none. They matter more than usual here because the
 * session token lives in localStorage (ADR 010): anything that can frame the
 * page or run in its origin can read it.
 */
const securityHeaders = [
  {
    // The app is HTTPS-only in production; refuse the downgrade entirely.
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    // Clickjacking: an attacker framing this page could trick an owner into
    // tapping "record payment" or "remove member" on an invisible overlay.
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    // Send the origin but never the path to other sites.
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // Nothing here needs these, so deny them rather than leave them available.
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

/**
 * Deliberately not configured:
 *
 * - Content-Security-Policy. A correct CSP for Next.js needs per-request nonces
 *   for its inline bootstrap scripts; a hand-written one either breaks the app
 *   or is loose enough to be theatre. Worth doing properly, not in passing.
 * - A vercel.json. Next.js is zero-config on Vercel. The monorepo root
 *   directory and NEXT_PUBLIC_API_URL are project settings in the dashboard,
 *   not file config, so an empty vercel.json would only add noise.
 */
