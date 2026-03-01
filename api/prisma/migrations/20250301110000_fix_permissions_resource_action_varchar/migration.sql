-- Fix permissions.resource and permissions.action: ensure VARCHAR (may be enum in older DB)
-- Safe to run even if columns are already varchar.
ALTER TABLE "permissions"
  ALTER COLUMN "resource" TYPE VARCHAR(50) USING resource::text,
  ALTER COLUMN "action" TYPE VARCHAR(50) USING action::text;
