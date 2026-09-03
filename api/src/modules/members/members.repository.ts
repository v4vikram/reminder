import type { Prisma } from "../../../generated/prisma/client.ts";
import { prisma } from "../../shared/config/prisma.ts";

/**
 * All database access for members lives here. Services call this rather than
 * touching Prisma directly, so query shapes stay in one place and other
 * modules have a defined door to knock on (see docs/adr/005).
 *
 * Every function takes gymId: tenant scoping is part of the query itself,
 * not something callers are trusted to remember.
 */

export function findManyByGym(
  gymId: string,
  where: Prisma.MemberWhereInput,
  skip: number,
  take: number,
) {
  return prisma.$transaction([
    prisma.member.findMany({
      where: { gymId, ...where },
      orderBy: [{ nextDueDate: "asc" }, { name: "asc" }],
      skip,
      take,
    }),
    prisma.member.count({ where: { gymId, ...where } }),
  ]);
}

export function findByIdInGym(gymId: string, memberId: string) {
  return prisma.member.findFirst({ where: { id: memberId, gymId } });
}

export function findByPhoneInGym(gymId: string, phone: string) {
  return prisma.member.findUnique({ where: { gymId_phone: { gymId, phone } } });
}

export function create(data: Prisma.MemberUncheckedCreateInput) {
  return prisma.member.create({ data });
}

export function update(memberId: string, data: Prisma.MemberUpdateInput) {
  return prisma.member.update({ where: { id: memberId }, data });
}

/**
 * Soft delete. The row is kept because payment history and past collection
 * reports depend on it, and members frequently rejoin. See docs/schema.md §3.7.
 */
export function deactivate(memberId: string) {
  return prisma.member.update({
    where: { id: memberId },
    data: { status: "INACTIVE" },
  });
}
