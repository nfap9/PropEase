# 数据库定义约定（Prisma + PostgreSQL）

本文档约定当前技术栈下的数据库设计，供前后端与 Prisma schema 一致使用。

## 原则

- **唯一来源**：表结构以 **Prisma schema**（`api/prisma/schema.prisma`）为准，由 Prisma 管理。
- **状态/角色/编码类字段**：一律使用 **`String` + `@db.VarChar(n)`**，不在 PostgreSQL 中使用 `CREATE TYPE ... AS ENUM`。这样与 API 契约（字符串）、前端展示一致，也便于扩展取值。
- **开发阶段**：可直接用 `prisma db push` 以 schema 为准同步到数据库，无需保留历史迁移；需要时可从干净库重新 `db push` 再跑 seed。

## 类型约定摘要

| 用途         | Prisma 类型     | 数据库类型   | 说明     |
|--------------|-----------------|--------------|----------|
| 主键/外键 ID | String          | VARCHAR(26)  | ULID     |
| 状态/角色/编码 | String        | VARCHAR(n)   | 不用 PG ENUM |
| 金额         | Decimal         | DECIMAL(10,2)| 保留精度 |
| 日期         | DateTime        | DATE/TIMESTAMP | 按需 @db.Date |
| 可选长文本   | String?         | VARCHAR(n)   | 按需长度 |

## 排查：库内是否仍有 PG ENUM

若曾手工改过库或从别处导入，可能出现「库里是 ENUM、Prisma 是 String」的不一致，导致 500（如 `Error converting field` 或 `invalid input value for enum`）。

**检查方式**：在 api 目录执行：

```bash
pnpm run check:db-enums
```

- 退出码 0：无 ENUM 列，与 schema 一致。
- 退出码 1：会打印仍为 PG ENUM 的列，需改为 VARCHAR 或对库执行 `prisma db push` 以 schema 为准覆盖。

**手动 SQL**（在目标库执行，列出所有使用自定义 enum 的列）：

```sql
SELECT t.table_schema, t.table_name, c.column_name, c.udt_name
FROM information_schema.columns c
JOIN information_schema.tables t
  ON t.table_schema = c.table_schema AND t.table_name = c.table_name
WHERE t.table_schema = 'public'
  AND c.data_type = 'USER-DEFINED'
  AND c.udt_name IN (SELECT typname FROM pg_type WHERE typtype = 'e')
ORDER BY t.table_name, c.column_name;
```

## 开发常用命令

- 以 schema 为准同步到数据库（不保留迁移历史）：`cd api && pnpm exec prisma db push`
- 生成 Client：`cd api && pnpm exec prisma generate`
- 若有迁移目录且需按迁移回放：在仓库根执行 `pnpm run migrate`
