import pino from 'pino';

/** 全局 logger 实例 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: 'apartment-ultra-api',
  },
});

/** 当前请求的 request ID（用于关联日志） */
let currentRequestId: string | undefined;

export function setRequestId(id: string): void {
  currentRequestId = id;
}

export function getRequestId(): string | undefined {
  return currentRequestId;
}

/**
 * 创建子 logger，带有额外的绑定信息
 * 例如: logger.child({ operation: 'bill_generation' })
 */
export function child(bindings: Record<string, unknown>): pino.Logger {
  return logger.child(bindings);
}
