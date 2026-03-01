# 数据库 Enum 与 Prisma String 对齐：根因与改进

## 问题现象

多个 API 接口返回 500，错误信息分为两类：

1. **读取时**：`Error converting field "xxx" of expected non-nullable type "String", found incompatible value of "yyy"`  
   - 出现在查询 `organization_members`、`permissions` 等表时。
2. **查询条件时**：`invalid input value for enum xxx: "yyy"`  
   - 出现在对 `bills.status`、`rooms.status` 等做 WHERE 条件时。

## 根因分析

### 1. 历史原因：Alembic 与 Prisma 混用

- Schema 注释写明：*「与现有 PostgreSQL 表结构一致（与 api Alembic 迁移对齐）」*、*「切换完成前由 Alembic 负责迁移」*。
- **Alembic（Python）** 迁移曾为「状态/角色/编码」类字段创建了 **PostgreSQL 原生 ENUM 类型**（如 `memberrole`、`billstatus`、`roomstatus`、以及 permissions 的 resource/action 对应枚举）。
- 当前 **Prisma schema** 中这些字段统一定义为 **`String` + `@db.VarChar(n)`**，未使用 Prisma 的 `enum` 语法。
- 因此出现：**库内是 PG ENUM，Prisma 期望 VARCHAR**，读写时类型不一致。

### 2. 技术机制

| 场景 | 表现 |
|------|------|
| **SELECT** | 驱动返回的 enum 值在 Prisma 反序列化时无法赋给 `String` → “Error converting field...” |
| **WHERE status = 'pending'** | Prisma 生成字符串字面量，PG 期望 enum 类型 → “invalid input value for enum...” |

### 3. 已修复的列（通过迁移改为 VARCHAR）

- `organization_members.role`
- `permissions.resource`, `permissions.action`
- `bills.status`
- `rooms.status`
- `notifications.type`
- `organization_subscriptions.billing_cycle`, `organization_subscriptions.status`
- `payments.payment_method`
- `system_role_configs.role`
- `system_role_permissions.role`
- `user_system_roles.role`

## 改进方案

### 1. 约定：状态/角色/编码一律用 VARCHAR（推荐）

- **新表/新列**：凡是“有限取值”的字段（status、role、type、code 等）在 Prisma 中一律用 `String` + `@db.VarChar(n)`，**不在 Prisma 里用 `enum`**，迁移中也**不要**在 PostgreSQL 里建 `CREATE TYPE ... AS ENUM`。
- **好处**：与 API 契约（字符串）、前端展示、多语言/扩展取值一致，避免 PG enum 与 Prisma 的二次对齐问题。

### 2. 一次性排查：是否还有遗留 PG ENUM

**推荐**：在 api 目录执行 `pnpm run check:db-enums`，会连接当前 `DATABASE_URL` 并列出仍为 PG ENUM 的列；无则退出 0，有则打印列表并退出 1。

或手动在**当前使用的数据库**中执行下面 SQL：

```sql
SELECT t.table_schema, t.table_name, c.column_name, c.udt_name
FROM information_schema.columns c
JOIN information_schema.tables t
  ON t.table_schema = c.table_schema AND t.table_name = c.table_name
WHERE t.table_schema = 'public'
  AND c.data_type = 'USER-DEFINED'
  AND c.udt_name IN (
    SELECT typname FROM pg_type
    WHERE typtype = 'e'
  )
ORDER BY t.table_name, c.column_name;
```

若结果中仍有本应由 Prisma 以 String 使用的表/列，应对其做一次 `ALTER COLUMN ... TYPE VARCHAR(n) USING column_name::text` 迁移（与已做的 4 个迁移一致）。

### 3. 迁移与发布流程

- **只使用 Prisma Migrate** 管理表结构，不再用 Alembic 修改与 Prisma 共用的表。
- 新增迁移时，涉及“状态/角色/编码”的列统一写为 `VARCHAR`，不引入新 PG enum。
- 若有从别处导入的库（如从 Alembic 时代导出的库），建议在接入前跑上述排查 SQL，并对仍为 enum 的列执行一次“enum → varchar”迁移再交给 Prisma。

### 4. 可选：CI 中检查是否误用 PG ENUM

若希望从流程上杜绝再引入 enum，可在 CI 中增加一步（仅作校验，不修改数据）：

- 连接当前环境数据库，执行上面的 `information_schema` + `pg_type` 查询。
- 对 Prisma 已映射的表（如 `organization_members`、`permissions`、`bills`、`rooms` 等），断言其 status/role/resource/action 等列**不在** `udt_name` 的 enum 列表中；若在则 CI 失败并提示“存在需对齐的 enum 列”。

### 5. 文档与交接

- 本文档作为“为何这些列必须是 VARCHAR 且不做 PG enum”的说明，便于后续维护和交接。
- 新成员或新环境复现时，若仍遇到 “Error converting field” 或 “invalid input value for enum”，优先检查该表该列在库内是否为 enum，并按本文“已修复的列”的方式增加一条 `ALTER COLUMN ... TYPE VARCHAR(n) USING ...::text` 迁移。

## 小结

| 项 | 说明 |
|----|------|
| **根因** | 历史 Alembic 迁移使用 PG ENUM，当前 Prisma schema 使用 String/VARCHAR，二者不一致。 |
| **已做** | 对 4 处列增加迁移，统一改为 VARCHAR，与 Prisma 一致。 |
| **预防** | 新字段一律 VARCHAR；仅用 Prisma Migrate；可选 CI 检查 PG enum。 |
| **排查** | 用 `information_schema` + `pg_type` SQL 找出仍为 enum 的列并逐个改为 VARCHAR。 |
