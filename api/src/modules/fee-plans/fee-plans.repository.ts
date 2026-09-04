import type { Prisma } from "../../../generated/prisma/client.ts";
import { prisma } from "../../shared/config/prisma.ts";

export function findManyByGym(gymId: string) {
  return prisma.feePlan.findMany({ where: { gymId }, orderBy: { months: "asc" } });
}

export function findByIdInGym(gymId: string, id: string) {
  return prisma.feePlan.findFirst({ where: { id, gymId } });
}

export function findByMonthsInGym(gymId: string, months: number) {
  return prisma.feePlan.findUnique({ where: { gymId_months: { gymId, months } } });
}

export function create(data: Prisma.FeePlanUncheckedCreateInput) {
  return prisma.feePlan.create({ data });
}

export function update(id: string, data: Prisma.FeePlanUncheckedUpdateInput) {
  return prisma.feePlan.update({ where: { id }, data });
}

export function remove(id: string) {
  return prisma.feePlan.delete({ where: { id } });
}
