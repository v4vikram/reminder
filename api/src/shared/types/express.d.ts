import type { Gym } from "../../../generated/prisma/client.ts";

declare global {
  namespace Express {
    interface Request {
      /** Set by the authenticate middleware. */
      user?: { id: string; email: string };
      /** Set by the tenantGuard middleware: the verified, owned gym. */
      gym?: Gym;
    }
  }
}

export {};
