/**
 * Redis 客户端单例
 *
 * 为 Token 黑名单和 Rate Limiting 提供共享的 Redis 连接。
 * 使用 ioredis 自动重连，适合长期运行的服务。
 */
import { Redis } from 'ioredis';
import type { Redis as RedisType } from 'ioredis';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

let redisClient: RedisType | null = null;

/**
 * 获取 Redis 客户端实例
 * - 如果已存在直接返回（单例）
 * - 如果配置了 REDIS_URL 则创建连接
 * - 如果未配置，返回 null（功能降级）
 */
export function getRedisClient(): RedisType | null {
  if (redisClient) return redisClient;

  if (!config.redisUrl) {
    logger.warn('REDIS_URL 未配置，Redis 功能（Token 黑名单/Rate Limiting）将不可用');
    return null;
  }

  redisClient = new Redis(config.redisUrl, {
    lazyConnect: true,
    retryStrategy(times: number) {
      const delay = Math.min(times * 100, 3000);
      return delay;
    },
    maxRetriesPerRequest: 3,
  });

  redisClient.on('connect', () => {
    logger.info('Redis 连接成功');
  });

  redisClient.on('error', (err: Error) => {
    logger.error({ err }, 'Redis 连接错误');
  });

  redisClient.on('close', () => {
    logger.warn('Redis 连接已关闭');
  });

  return redisClient;
}

/**
 * 关闭 Redis 连接（用于测试或 graceful shutdown）
 */
export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis 连接已关闭');
  }
}

/**
 * Token 黑名单 Key 前缀
 */
export const BLACKLIST_PREFIX = 'token_blacklist:';

/**
 * 将 Token 加入黑名单
 * @param jti JWT ID（Token 的唯一标识）
 * @param ttlSeconds 剩余有效期（秒），一到期自动删除
 */
export async function addToBlacklist(jti: string, ttlSeconds: number): Promise<void> {
  const client = getRedisClient();
  if (!client) return;
  try {
    await client.setex(`${BLACKLIST_PREFIX}${jti}`, ttlSeconds, '1');
  } catch (err) {
    logger.error({ err, jti }, '加入 Token 黑名单失败');
  }
}

/**
 * 检查 Token 是否在黑名单中
 * @param jti JWT ID
 * @returns true 如果已被吊销
 */
export async function isTokenBlacklisted(jti: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;
  try {
    const exists = await client.exists(`${BLACKLIST_PREFIX}${jti}`);
    return exists === 1;
  } catch (err) {
    logger.error({ err, jti }, '检查 Token 黑名单失败');
    return false; // 失败时保守处理，不阻断请求
  }
}
