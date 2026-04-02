/**
 * Prisma 数据库客户端模块
 *
 * 使用 Prisma PgAdapter 连接 PostgreSQL，实现：
 * - 全局单例模式（开发环境热更新不丢失连接）
 * - 优雅关闭（处理进程退出信号）
 * - 开发环境详细日志，生产环境仅记录错误
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';

// 数据库连接字符串，从环境变量读取
const connectionString = process.env.DATABASE_URL;
// PostgreSQL 连接池
const pool = new pg.Pool({ connectionString });
// Prisma PostgreSQL 适配器
const adapter = new PrismaPg(pool);

/**
 * 全局 Prisma 客户端引用
 * 用于开发环境热更新时保持单例，避免连接耗尽
 */
const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

/**
 * Prisma 客户端单例
 * - 首次创建后缓存到 global，保留到进程结束
 * - 开发环境额外缓存到 globalForPrisma，支持 HMR
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

// 开发环境缓存实例到 global，防止 HMR 导致连接耗尽
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// 优雅关闭标记，防止重复清理
let cleanedUp = false;

/**
 * 清理数据库连接
 * 在进程退出前断开 Prisma 和连接池
 */
const cleanup = async () => {
  if (cleanedUp) return;
  cleanedUp = true;
  await prisma.$disconnect().catch(() => undefined);
  await pool.end().catch(() => undefined);
};

// 注册进程退出清理
process.on('beforeExit', cleanup);
process.on('SIGINT', () => void cleanup());   // Ctrl+C 中断
process.on('SIGTERM', () => void cleanup());  // 容器终止信号
