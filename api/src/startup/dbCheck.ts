/**
 * 数据库连接检查
 * 在应用启动时验证数据库连接是否正常
 */
import { prisma } from '../lib/prisma.js';

export interface DbCheckResult {
  connected: boolean;
  latency?: number;
  error?: string;
}

/**
 * 等待数据库连接
 * @param maxRetries 最大重试次数
 * @param retryDelayMs 重试间隔（毫秒）
 */
export async function waitForDatabase(
  maxRetries: number = 10,
  retryDelayMs: number = 2000
): Promise<DbCheckResult> {
  console.log(`[启动检查] 开始检查数据库连接...`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;
      console.log(`[启动检查] 数据库连接成功 (延迟: ${latency}ms)`);
      return { connected: true, latency };
    } catch (error) {
      const latency = Date.now() - start;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(
        `[启动检查] 数据库连接 ${attempt}/${maxRetries} 失败 (${latency}ms): ${errorMessage}`
      );

      if (attempt < maxRetries) {
        console.log(`[启动检查] ${retryDelayMs / 1000}秒后重试...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
  }

  console.error(`[启动检查] 数据库连接失败，已达到最大重试次数 ${maxRetries}`);
  return { connected: false, error: 'Connection failed after max retries' };
}

/**
 * 验证数据库 schema 是否已同步
 * 检查必要的表是否存在
 */
export async function verifyDatabaseSchema(): Promise<boolean> {
  try {
    // 检查关键表是否存在（使用实际的表名）
    const tables = ['users', 'organizations', 'apartments', 'rooms', 'leases', 'admin_users', 'apartment_configs', 'apartment_fee_items'];
    for (const table of tables) {
      const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = ${table}
        ) as exists
      `;
      if (!result[0]?.exists) {
        console.error(`[启动检查] 数据库表 "${table}" 不存在，请先运行数据库迁移`);
        return false;
      }
    }
    console.log(`[启动检查] 数据库 schema 验证通过`);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[启动检查] 数据库 schema 验证失败: ${errorMessage}`);
    return false;
  }
}
