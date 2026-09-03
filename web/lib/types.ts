/**
 * Wire types, mirroring docs/api-spec.yaml.
 *
 * Hand-written for now. Once the API stabilises these should be generated from
 * the OpenAPI spec (openapi-typescript) so the two cannot drift apart - that is
 * the main reason every operation in the spec has an explicit operationId.
 */

export type DueStatus = "overdue" | "due_soon" | "upcoming";
export type MemberStatus = "ACTIVE" | "INACTIVE";
export type PaymentMethod = "CASH" | "UPI" | "CARD" | "OTHER";
export type GymPlan = "TRIAL" | "FREE" | "PAID";

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface Gym {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  plan: GymPlan;
  monthlyPrice: number | null;
  trialEndsAt: string | null;
  reminderDaysBefore: number;
  createdAt: string;
  updatedAt: string;
}

export interface Member {
  id: string;
  gymId: string;
  name: string;
  phone: string;
  feeAmount: number;
  joinDate: string;
  nextDueDate: string;
  status: MemberStatus;
  dueStatus: DueStatus;
  daysOverdue: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  gymId: string;
  memberId: string;
  amount: number;
  paidAt: string;
  periodStart: string | null;
  periodEnd: string | null;
  method: PaymentMethod;
  recordedById: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  gymId: string;
  memberId: string;
  channel: "WHATSAPP_MANUAL" | "WHATSAPP_API" | "SMS";
  status: "PENDING" | "SENT" | "FAILED";
  messageText: string | null;
  sentAt: string | null;
  failureReason: string | null;
  createdAt: string;
}

export interface PendingReminder {
  member: Member;
  messageText: string;
  waLink: string;
  lastRemindedAt: string | null;
}

export interface DashboardSummary {
  totalMembers: number;
  activeMembers: number;
  dueToday: number;
  dueSoon: number;
  overdue: number;
  collectedThisMonth: number;
  pendingAmount: number;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
}
