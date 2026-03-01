-- 将剩余仍为 PG ENUM 的列改为 VARCHAR，与 Prisma String 一致（参见 check:db-enums）
ALTER TABLE "notifications"
  ALTER COLUMN "type" TYPE VARCHAR(50) USING type::text;

ALTER TABLE "organization_subscriptions"
  ALTER COLUMN "billing_cycle" TYPE VARCHAR(20) USING billing_cycle::text,
  ALTER COLUMN "status" TYPE VARCHAR(20) USING status::text;

ALTER TABLE "payments"
  ALTER COLUMN "payment_method" TYPE VARCHAR(20) USING payment_method::text;

ALTER TABLE "system_role_configs"
  ALTER COLUMN "role" TYPE VARCHAR(50) USING role::text;

ALTER TABLE "system_role_permissions"
  ALTER COLUMN "role" TYPE VARCHAR(50) USING role::text;

ALTER TABLE "user_system_roles"
  ALTER COLUMN "role" TYPE VARCHAR(50) USING role::text;
