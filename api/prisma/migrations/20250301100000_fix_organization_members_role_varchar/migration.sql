-- Fix organization_members.role: ensure VARCHAR(20) (was possibly enum MemberRole in older DB)
-- Safe to run even if column is already varchar.
ALTER TABLE "organization_members"
  ALTER COLUMN "role" TYPE VARCHAR(20) USING role::text;
