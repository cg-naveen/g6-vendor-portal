-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID');

-- AlterTable
ALTER TABLE "Bill" ADD COLUMN     "amountPaid" DECIMAL(14,2),
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
ADD COLUMN     "receiptNumber" TEXT,
ADD COLUMN     "receiptPath" TEXT,
ADD COLUMN     "transactionFee" DECIMAL(14,2);

-- AlterTable
ALTER TABLE "InvoiceSubmission" ADD COLUMN     "amountPaid" DECIMAL(14,2),
ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
ADD COLUMN     "receiptNumber" TEXT,
ADD COLUMN     "receiptPath" TEXT,
ADD COLUMN     "transactionFee" DECIMAL(14,2);

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "autoBillingEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "createdByAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastBilledAt" TIMESTAMP(3),
ADD COLUMN     "nextBillingDate" TIMESTAMP(3),
ADD COLUMN     "recurringAmount" DECIMAL(14,2),
ADD COLUMN     "recurringDescription" TEXT;

-- CreateTable
CREATE TABLE "OrgSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "companyName" TEXT NOT NULL DEFAULT 'G6 Labs Asia',
    "address" TEXT,
    "taxId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Bill_receiptNumber_key" ON "Bill"("receiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceSubmission_receiptNumber_key" ON "InvoiceSubmission"("receiptNumber");

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

