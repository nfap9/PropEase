import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

/** Pino 传输目标配置 */
function createPinoOptions() {
  const baseOptions = {
    level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),
    formatters: {
      level: (label: string) => ({ level: label }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    base: {
      service: 'propease-api',
    },
  };

  if (isDev) {
    // 开发环境：使用 pino-pretty 美化输出
    return {
      ...baseOptions,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
          indent: 2,
        },
      },
    };
  }

  // 生产环境：输出原始 JSON，便于日志收集系统处理
  return baseOptions;
}

/** 全局 logger 实例 */
export const logger = pino(createPinoOptions());

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
