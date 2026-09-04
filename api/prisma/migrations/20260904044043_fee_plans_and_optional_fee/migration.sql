-- AlterTable
ALTER TABLE "members" ALTER COLUMN "feeAmount" DROP NOT NULL;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "months" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "fee_plans" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "months" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fee_plans_gymId_months_idx" ON "fee_plans"("gymId", "months");

-- CreateIndex
CREATE UNIQUE INDEX "fee_plans_gymId_months_key" ON "fee_plans"("gymId", "months");

-- AddForeignKey
ALTER TABLE "fee_plans" ADD CONSTRAINT "fee_plans_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
