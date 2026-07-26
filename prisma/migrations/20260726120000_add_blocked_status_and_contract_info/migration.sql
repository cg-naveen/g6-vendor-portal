-- Add BLOCKED value to VendorStatus enum
ALTER TYPE "VendorStatus" ADD VALUE IF NOT EXISTS 'BLOCKED';

-- Add contract info (rich text) column to Vendor
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "contractInfo" TEXT;
