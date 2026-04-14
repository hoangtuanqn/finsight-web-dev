-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "monthlyIncome" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "extraBudget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "originalAmount" DOUBLE PRECISION NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "apr" DOUBLE PRECISION NOT NULL,
    "rateType" TEXT NOT NULL DEFAULT 'FLAT',
    "feeProcessing" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "feeInsurance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "feeManagement" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "feePenaltyPerDay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minPayment" DOUBLE PRECISION NOT NULL,
    "dueDay" INTEGER NOT NULL,
    "termMonths" INTEGER NOT NULL,
    "remainingTerms" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "debts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "debtId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investor_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "capital" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlyAdd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "goal" TEXT NOT NULL DEFAULT 'GROWTH',
    "horizon" TEXT NOT NULL DEFAULT 'MEDIUM',
    "riskLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allocations" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "sentimentValue" INTEGER NOT NULL,
    "sentimentLabel" TEXT NOT NULL,
    "savings" DOUBLE PRECISION NOT NULL,
    "gold" DOUBLE PRECISION NOT NULL,
    "stocks" DOUBLE PRECISION NOT NULL,
    "bonds" DOUBLE PRECISION NOT NULL,
    "crypto" DOUBLE PRECISION NOT NULL,
    "recommendation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debt_snapshots" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalDebt" DOUBLE PRECISION NOT NULL,
    "totalEAR" DOUBLE PRECISION NOT NULL,
    "debtToIncome" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "debt_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "investor_profiles_userId_key" ON "investor_profiles"("userId");

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "debts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_profiles" ADD CONSTRAINT "investor_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "investor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_snapshots" ADD CONSTRAINT "debt_snapshots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
