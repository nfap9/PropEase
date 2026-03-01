-- Fix rooms.status: ensure VARCHAR(20) (may be enum roomstatus in older DB)
ALTER TABLE "rooms"
  ALTER COLUMN "status" TYPE VARCHAR(20) USING status::text;
