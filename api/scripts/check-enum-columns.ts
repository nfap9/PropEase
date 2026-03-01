/**
 * 检查当前数据库中仍使用 PostgreSQL ENUM 类型的列。
 * Prisma schema 中状态/角色/编码等为 String；若库内为 ENUM 会导致 500。可执行 prisma db push 以 schema 为准同步。
 * 用法：在 api 目录下执行 pnpm run check:db-enums
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Row = { table_schema: string; table_name: string; column_name: string; udt_name: string };

async function main(): Promise<void> {
  const rows = await prisma.$queryRawUnsafe<Row[]>(`
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
    ORDER BY t.table_name, c.column_name
  `);

  if (rows.length === 0) {
    console.log('未发现使用 PostgreSQL ENUM 的列，与 Prisma String 一致。');
    return;
  }

  console.log('以下列仍为 PG ENUM，若 Prisma 中为 String 会导致 500，建议改为 VARCHAR：\n');
  for (const r of rows) {
    console.log(`  ${r.table_schema}.${r.table_name}.${r.column_name} (udt: ${r.udt_name})`);
  }
  console.log('\n参见 docs/database-enum-varchar-alignment.md');
  process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
