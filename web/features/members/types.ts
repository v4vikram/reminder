export type DueStatus = "overdue" | "due_soon" | "upcoming";
export type MemberStatus = "ACTIVE" | "INACTIVE";

export interface Member {
  id: string;
  gymId: string;
  name: string;
  phone: string;
  /** Null when the owner has not agreed a fee for this member yet. */
  feeAmount: number | null;
  joinDate: string;
  nextDueDate: string;
  status: MemberStatus;
  /** Derived server-side so every client agrees on the boundaries. */
  dueStatus: DueStatus;
  daysOverdue: number;
  /**
   * Arrears as a span, not a single figure. A member three months behind owes
   * three months. Null when nothing is overdue.
   */
  pending: {
    months: number;
    from: string;
    to: string;
    /** months x feeAmount, or null when no fee is set. */
    amount: number | null;
  } | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MemberListFilters {
  status?: MemberStatus;
  dueFilter?: DueStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateMemberInput {
  name: string;
  phone: string;
  /** Optional: a fee is often agreed later, when the first payment is taken. */
  feeAmount?: number;
  joinDate: string;
  nextDueDate?: string;
  notes?: string;
}

export interface UpdateMemberInput {
  name?: string;
  phone?: string;
  feeAmount?: number;
  nextDueDate?: string;
  status?: MemberStatus;
  notes?: string;
}
