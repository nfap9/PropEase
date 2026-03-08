import type { Request, Response } from 'express';
import { config } from '../config.js';
import { prisma } from '../lib/prisma.js';

interface HealthCheckResult {
  status: 'ok' | 'error';
  latency?: number;
  message?: string;
}

interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  app: string;
  version: string;
  is_dev: boolean;
  checks: {
    database: HealthCheckResult;
  };
}

/**
 * 检查数据库连接
 */
async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'ok',
      latency: Date.now() - start,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      status: 'error',
      latency: Date.now() - start,
      message,
    };
  }
}

/**
 * 健康检查处理器
 * 检查应用及其依赖服务的健康状态
 */
export async function healthHandler(_req: Request, res: Response): Promise<void> {
  const checks = {
    database: await checkDatabase(),
  };

  const allHealthy = checks.database.status === 'ok';

  const response: HealthResponse = {
    status: allHealthy ? 'healthy' : 'unhealthy',
    app: config.appName,
    version: '0.1.0',
    is_dev: config.isDev,
    checks,
  };

  res.status(allHealthy ? 200 : 503).json(response);
}
