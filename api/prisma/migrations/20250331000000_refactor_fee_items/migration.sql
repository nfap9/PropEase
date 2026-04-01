-- Refactor fee items from tree structure (FeeType->FeeSpecification) to flat structure (OrgFeeItem)
-- This migration deletes FeeType, FeeSpecification, ApartmentFeeConfig models
-- and creates OrgFeeItem model with redundant fields in LeaseFeeItem and BillFeeItem

-- 1. Create org_fee_items table
CREATE TABLE "org_fee_items" (
    "id" VARCHAR(26) NOT NULL,
    "organization_id" VARCHAR(26) NOT NULL,
    "category" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "amount" DECIMAL(10, 2) NOT NULL,
    "cycle" VARCHAR(20) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "org_fee_items_pkey" PRIMARY KEY ("id")
);

-- 2. Add unique constraint on organization_id + name
CREATE UNIQUE INDEX "org_fee_items_organization_id_name_key" ON "org_fee_items"("organization_id", "name");

-- 3. Add new columns to lease_fee_items (nullable for existing data)
ALTER TABLE "lease_fee_items" ADD COLUMN "fee_category" VARCHAR(20);
ALTER TABLE "lease_fee_items" ADD COLUMN "fee_name" VARCHAR(100);
ALTER TABLE "lease_fee_items" ADD COLUMN "fee_amount" DECIMAL(10, 2);
ALTER TABLE "lease_fee_items" ADD COLUMN "fee_cycle" VARCHAR(20);

-- 4. Add new columns to bill_fee_items (nullable for existing data)
ALTER TABLE "bill_fee_items" ADD COLUMN "fee_category" VARCHAR(20);
ALTER TABLE "bill_fee_items" ADD COLUMN "fee_name" VARCHAR(100);
ALTER TABLE "bill_fee_items" ADD COLUMN "fee_amount" DECIMAL(10, 2);
ALTER TABLE "bill_fee_items" ADD COLUMN "fee_cycle" VARCHAR(20);

-- 5. Drop old foreign keys and columns from lease_fee_items
ALTER TABLE "lease_fee_items" DROP CONSTRAINT "lease_fee_items_fee_type_id_fkey";
ALTER TABLE "lease_fee_items" DROP COLUMN "specification_id";

-- 6. Drop old foreign keys and columns from bill_fee_items
ALTER TABLE "bill_fee_items" DROP CONSTRAINT "bill_fee_items_fee_type_id_fkey";
ALTER TABLE "bill_fee_items" DROP COLUMN "specification_id";

-- 7. Drop old tables (data will be lost)
DROP TABLE IF EXISTS "apartment_fee_configs";
DROP TABLE IF EXISTS "fee_specifications";
DROP TABLE IF EXISTS "fee_types";

-- 8. Add new foreign key constraints for lease_fee_items
ALTER TABLE "lease_fee_items" ADD CONSTRAINT "lease_fee_items_fee_type_id_fkey"
    FOREIGN KEY ("fee_type_id") REFERENCES "org_fee_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 9. Add new foreign key constraints for bill_fee_items
ALTER TABLE "bill_fee_items" ADD CONSTRAINT "bill_fee_items_fee_type_id_fkey"
    FOREIGN KEY ("fee_type_id") REFERENCES "org_fee_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Migration completed successfully
