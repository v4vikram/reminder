import type { Gym } from "@/features/gyms/types";

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
}

/** GET /auth/me: the signed-in user together with the gyms they own. */
export interface Session {
  user: User;
  gyms: Gym[];
}
