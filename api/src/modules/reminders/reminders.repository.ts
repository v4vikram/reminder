import type { Prisma } from "../../../generated/prisma/client.ts";
import { prisma } from "../../shared/config/prisma.ts";

export function create(data: Prisma.ReminderUncheckedCreateInput) {
  return prisma.reminder.create({ data });
}

export function findManyByGym(
  gymId: string,
  where: Prisma.ReminderWhereInput,
  skip: number,
  take: number,
) {
  return prisma.$transaction([
    prisma.reminder.findMany({
      where: { gymId, ...where },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.reminder.count({ where: { gymId, ...where } }),
  ]);
}

/**
 * Most recent reminder timestamp per member, for the given member ids.
 *
 * One grouped query rather than one query per member: the pending list can hold
 * a couple of hundred rows and N+1 queries there would be the first thing to
 * slow the dashboard down.
 */
export function lastSentByMember(gymId: string, memberIds: string[]) {
  return prisma.reminder.groupBy({
    by: ["memberId"],
    where: { gymId, memberId: { in: memberIds }, status: "SENT" },
    _max: { createdAt: true },
  });
}
