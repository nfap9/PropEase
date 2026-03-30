-- CreateLeaseFeeItem
CREATE TABLE "lease_fee_items" (
    "id" VARCHAR(26) NOT NULL,
    "lease_id" VARCHAR(26) NOT NULL,
    "fee_type_id" VARCHAR(26) NOT NULL,
    "specification_id" VARCHAR(26),
    "quantity" DECIMAL(10, 2) NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "lease_fee_items_pkey" PRIMARY KEY ("id")
);

-- CreateLeaseChangeLog
CREATE TABLE "lease_change_logs" (
    "id" VARCHAR(26) NOT NULL,
    "lease_id" VARCHAR(26) NOT NULL,
    "change_type" VARCHAR(50) NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "effective_from_year" INTEGER,
    "effective_from_month" INTEGER,
    "reason" VARCHAR(500),
    "created_by" VARCHAR(26),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lease_change_logs_pkey" PRIMARY KEY ("id")
);

-- Add indexes
CREATE INDEX "lease_fee_items_lease_id_idx" ON "lease_fee_items"("lease_id");
CREATE INDEX "lease_change_logs_lease_id_created_at_idx" ON "lease_change_logs"("lease_id", "created_at");
CREATE INDEX "lease_change_logs_effective_year_month_idx" ON "lease_change_logs"("effective_from_year", "effective_from_month");

-- Add foreign keys
ALTER TABLE "lease_fee_items" ADD CONSTRAINT "lease_fee_items_lease_id_fkey"
    FOREIGN KEY ("lease_id") REFERENCES "leases"("id") ON DELETE CASCADE;
ALTER TABLE "lease_fee_items" ADD CONSTRAINT "lease_fee_items_fee_type_id_fkey"
    FOREIGN KEY ("fee_type_id") REFERENCES "fee_types"("id");
ALTER TABLE "lease_fee_items" ADD CONSTRAINT "lease_fee_items_specification_id_fkey"
    FOREIGN KEY ("specification_id") REFERENCES "fee_specifications"("id") ON DELETE SET NULL;

ALTER TABLE "lease_change_logs" ADD CONSTRAINT "lease_change_logs_lease_id_fkey"
    FOREIGN KEY ("lease_id") REFERENCES "leases"("id") ON DELETE CASCADE;

-- Add reverse relations to Lease (handled via Prisma, but FK already added above)

-- Add reverse relations to FeeType (handled via Prisma)
-- Add reverse relations to FeeSpecification (handled via Prisma)

-- Migration completed successfully