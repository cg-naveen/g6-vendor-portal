-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN "billingDayOfMonth" INTEGER;

-- Backfill billing day from existing next billing dates
UPDATE "Vendor"
SET "billingDayOfMonth" = EXTRACT(DAY FROM "nextBillingDate")::INTEGER
WHERE "nextBillingDate" IS NOT NULL AND "billingDayOfMonth" IS NULL;
