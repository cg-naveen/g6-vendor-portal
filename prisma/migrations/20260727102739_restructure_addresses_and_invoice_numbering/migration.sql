-- DropIndex
DROP INDEX "InvoiceSubmission_invoiceNumber_key";

-- AlterTable: add new columns first (old columns still present for backfill)
ALTER TABLE "Vendor"
ADD COLUMN     "accountHolderName" TEXT,
ADD COLUMN     "bankAddressLine1" TEXT,
ADD COLUMN     "bankAddressLine2" TEXT,
ADD COLUMN     "bankCity" TEXT,
ADD COLUMN     "bankCountry" TEXT,
ADD COLUMN     "bankPostcode" TEXT,
ADD COLUMN     "bankState" TEXT,
ADD COLUMN     "homeAddressLine1" TEXT,
ADD COLUMN     "homeAddressLine2" TEXT,
ADD COLUMN     "homeCity" TEXT,
ADD COLUMN     "homeCountry" TEXT,
ADD COLUMN     "homePostcode" TEXT,
ADD COLUMN     "homeState" TEXT,
ADD COLUMN     "invoiceSequence" INTEGER NOT NULL DEFAULT 0;

-- Backfill: preserve existing free-text address data into line 1 of the new structured fields
UPDATE "Vendor" SET "homeAddressLine1" = "homeAddress" WHERE "homeAddress" IS NOT NULL;
UPDATE "Vendor" SET "bankAddressLine1" = "bankAddress" WHERE "bankAddress" IS NOT NULL;
UPDATE "Vendor" SET "accountHolderName" = COALESCE("companyName", "vendorName") WHERE "accountHolderName" IS NULL;

-- AlterTable: now drop the old free-text columns
ALTER TABLE "Vendor" DROP COLUMN "bankAddress",
DROP COLUMN "homeAddress";

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceSubmission_vendorId_invoiceNumber_key" ON "InvoiceSubmission"("vendorId", "invoiceNumber");
