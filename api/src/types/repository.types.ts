import type { PrismaClient } from '../generated/client/index.js';

/**
 * 数据库客户端类型 - 支持 PrismaClient 或事务对象
 * 用于 Repository 层的依赖注入
 */
export type DbClient =
  | PrismaClient
  | Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

/**
 * Repository 工厂函数类型
 */
export type RepositoryFactory<T> = (db: DbClient) => T;
