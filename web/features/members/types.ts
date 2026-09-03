export type DueStatus = "overdue" | "due_soon" | "upcoming";
export type MemberStatus = "ACTIVE" | "INACTIVE";

export interface Member {
  id: string;
  gymId: string;
  name: string;
  phone: string;
  feeAmount: number;
  joinDate: string;
  nextDueDate: string;
  status: MemberStatus;
  /** Derived server-side so every client agrees on the boundaries. */
  dueStatus: DueStatus;
  daysOverdue: number;
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
  feeAmount: number;
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
