/**
 * Rate Limiting 中间件
 *
 * 基于 Redis 滑动窗口算法的请求频率限制。
 * - 登录接口：5次/分钟/IP
 * - 注册接口：3次/分钟/IP
 * - 通用接口：100次/分钟/User（未登录则按 IP）
 */
import type { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../lib/redis.js';
import type { Redis as RedisType } from 'ioredis';
import { createAppError } from '../utils/appError.js';
import { logger } from '../utils/logger.js';

/**
 * Rate Limit 配置
 */
export interface RateLimitConfig {
  /** 窗口大小（秒） */
  windowSeconds: number;
  /** 最大请求数 */
  maxRequests: number;
  /** 限制范围的键类型 */
  keyType: 'ip' | 'user' | 'ip_or_user';
}

/**
 * 默认配置
 */
const DEFAULT_WINDOW = 60; // 1 分钟窗口
const DEFAULT_MAX = 100;

const PRESETS: Record<string, RateLimitConfig> = {
  login: { windowSeconds: 60, maxRequests: 5, keyType: 'ip' },
  register: { windowSeconds: 60, maxRequests: 3, keyType: 'ip' },
  default: { windowSeconds: DEFAULT_WINDOW, maxRequests: DEFAULT_MAX, keyType: 'ip_or_user' },
};

type PresetName = keyof typeof PRESETS;

/**
 * 获取请求标识（用于 Redis Key）
 */
function getIdentifier(req: Request, keyType: 'ip' | 'user' | 'ip_or_user'): string {
  const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';

  if (keyType === 'ip') {
    return ip;
  }

  // 尝试从 token 中获取 user ID
  const auth = req.headers.authorization;
  let userId: string | undefined;
  if (auth?.startsWith('Bearer ')) {
    try {
      const token = auth.slice(7);
      // 简单解析 JWT payload（不解码签名）
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(
          Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
        );
        userId = payload.sub as string | undefined;
      }
    } catch {
      // ignore parse errors
    }
  }

  if (keyType === 'user' || (keyType === 'ip_or_user' && userId)) {
    return userId ?? ip;
  }

  return ip;
}

/**
 * 滑动窗口计数（Redis ZSET 实现）
 * @param client Redis 客户端
 * @param key 限流 key
 * @param now 当前时间戳（秒）
 * @param windowSeconds 窗口大小
 * @param maxRequests 最大请求数
 * @returns true 如果超过限制
 */
async function isRateLimited(
  client: RedisType,
  key: string,
  now: number,
  windowSeconds: number,
  maxRequests: number
): Promise<{ limited: boolean; remaining: number; resetInSeconds: number }> {
  const windowStart = now - windowSeconds;

  // 移除窗口外的记录
  await client.zremrangebyscore(key, 0, windowStart);

  // 统计当前窗口内请求数
  const count = await client.zcard(key);

  if (count >= maxRequests) {
    // 获取最旧一条的时间，计算还需等待多久
    const oldest = await client.zrange(key, 0, 0, 'WITHSCORES');
    const oldestTime = oldest.length >= 2 ? parseInt(oldest[1], 10) : now;
    const resetIn = Math.ceil(oldestTime + windowSeconds - now);
    return { limited: true, remaining: 0, resetInSeconds: resetIn };
  }

  // 添加当前请求
  await client.zadd(key, now, `${now}:${Math.random()}`);
  // 设置 key 过期时间，防止内存泄漏
  await client.expire(key, windowSeconds + 1);

  return {
    limited: false,
    remaining: maxRequests - count - 1,
    resetInSeconds: windowSeconds,
  };
}

/**
 * 创建 Rate Limit 中间件
 */
export function rateLimit(preset: PresetName = 'default') {
  const config = PRESETS[preset] ?? PRESETS.default;

  return async function rateLimitMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const client = getRedisClient();

    // Redis 不可用时，降级通过（避免阻断服务）
    if (!client) {
      next();
      return;
    }

    const identifier = getIdentifier(req, config.keyType);
    const key = `ratelimit:${preset}:${identifier}`;
    const now = Math.floor(Date.now() / 1000);

    try {
      const result = await isRateLimited(client, key, now, config.windowSeconds, config.maxRequests);

      // 设置响应头
      res.setHeader('X-RateLimit-Limit', config.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
      res.setHeader('X-RateLimit-Reset', (now + result.resetInSeconds).toString());

      if (result.limited) {
        res.setHeader('Retry-After', result.resetInSeconds.toString());
        logger.warn({ identifier, preset }, 'Rate limit exceeded');
        next(createAppError(429, '请求过于频繁，请稍后再试'));
        return;
      }

      next();
    } catch (err) {
      logger.error({ err, identifier, preset }, 'Rate limit check failed');
      // Redis 错误时降级通过
      next();
    }
  };
}

/**
 * 登录接口限流中间件（5次/分钟/IP）
 */
export const loginRateLimit = rateLimit('login');

/**
 * 注册接口限流中间件（3次/分钟/IP）
 */
export const registerRateLimit = rateLimit('register');

/**
 * 默认限流中间件（100次/分钟）
 */
export const defaultRateLimit = rateLimit('default');
