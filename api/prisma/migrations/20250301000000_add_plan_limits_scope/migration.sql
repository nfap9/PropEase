-- AlterTable
ALTER TABLE "subscription_plans" ADD COLUMN "max_organizations" INTEGER;
ALTER TABLE "subscription_plans" ADD COLUMN "rooms_count_scope" VARCHAR(20) NOT NULL DEFAULT 'organization';
ALTER TABLE "subscription_plans" ADD COLUMN "members_count_scope" VARCHAR(20) NOT NULL DEFAULT 'organization';
