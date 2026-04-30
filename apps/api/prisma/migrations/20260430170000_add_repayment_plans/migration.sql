-- CreateTable
CREATE TABLE "repayment_plans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "strategy" TEXT NOT NULL DEFAULT 'CUSTOM',
    "extraBudget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repayment_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repayment_plan_items" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "debtId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repayment_plan_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "repayment_plans_userId_idx" ON "repayment_plans"("userId");

-- CreateIndex
CREATE INDEX "repayment_plan_items_planId_sortOrder_idx" ON "repayment_plan_items"("planId", "sortOrder");

-- CreateIndex
CREATE INDEX "repayment_plan_items_debtId_idx" ON "repayment_plan_items"("debtId");

-- CreateIndex
CREATE UNIQUE INDEX "repayment_plan_items_planId_debtId_key" ON "repayment_plan_items"("planId", "debtId");

-- AddForeignKey
ALTER TABLE "repayment_plans" ADD CONSTRAINT "repayment_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repayment_plan_items" ADD CONSTRAINT "repayment_plan_items_planId_fkey" FOREIGN KEY ("planId") REFERENCES "repayment_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repayment_plan_items" ADD CONSTRAINT "repayment_plan_items_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "debts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
