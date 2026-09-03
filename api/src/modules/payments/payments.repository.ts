import type { Prisma } from "../../../generated/prisma/client.ts";
import { prisma } from "../../shared/config/prisma.ts";

/** Creates a payment inside an existing transaction. */
export function createTx(
  tx: Prisma.TransactionClient,
  data: Prisma.PaymentUncheckedCreateInput,
) {
  return tx.payment.create({ data });
}

export function findManyByGym(
  gymId: string,
  where: Prisma.PaymentWhereInput,
  skip: number,
  take: number,
) {
  return prisma.$transaction([
    prisma.payment.findMany({
      where: { gymId, ...where },
      orderBy: { paidAt: "desc" },
      skip,
      take,
    }),
    prisma.payment.count({ where: { gymId, ...where } }),
  ]);
}
