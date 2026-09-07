-- AlterTable: add nullable first so existing rows can be backfilled before the NOT NULL/unique constraint
ALTER TABLE "Vendor" ADD COLUMN "vendorCode" TEXT;

-- Backfill: assign each existing vendor a random 4-char code (same alphabet as
-- src/lib/vendorCode.ts, excluding 0/O and 1/I), retrying on collision.
DO $$
DECLARE
  alphabet TEXT := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  vendor_row RECORD;
  candidate TEXT;
  i INT;
BEGIN
  FOR vendor_row IN SELECT "id" FROM "Vendor" WHERE "vendorCode" IS NULL LOOP
    LOOP
      candidate := '';
      FOR i IN 1..4 LOOP
        candidate := candidate || substr(alphabet, floor(random() * length(alphabet) + 1)::int, 1);
      END LOOP;
      EXIT WHEN NOT EXISTS (SELECT 1 FROM "Vendor" WHERE "vendorCode" = candidate);
    END LOOP;
    UPDATE "Vendor" SET "vendorCode" = candidate WHERE "id" = vendor_row."id";
  END LOOP;
END $$;

-- AlterTable
ALTER TABLE "Vendor" ALTER COLUMN "vendorCode" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_vendorCode_key" ON "Vendor"("vendorCode");
