-- Fix bills.status: ensure VARCHAR(20) (may be enum billstatus in older DB)
ALTER TABLE "bills"
  ALTER COLUMN "status" TYPE VARCHAR(20) USING status::text;
