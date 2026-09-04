-- CreateEnum
CREATE TYPE "MessageLanguage" AS ENUM ('EN', 'HI_LATN');

-- AlterTable
ALTER TABLE "gyms" ADD COLUMN     "messageLanguage" "MessageLanguage" NOT NULL DEFAULT 'HI_LATN';
