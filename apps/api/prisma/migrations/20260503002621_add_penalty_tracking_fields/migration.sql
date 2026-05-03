-- AlterTable
ALTER TABLE "debts" ADD COLUMN     "lastHealthPenaltyAt" TIMESTAMP(3),
ADD COLUMN     "lastPenaltyAppliedAt" TIMESTAMP(3);
