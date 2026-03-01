/**
 * 业务状态码（与 Python 后端一致）
 * 0: 成功；4xxxx: 客户端错误；5xxxx: 服务端错误
 */
export const BusinessCode = {
  SUCCESS: 0,
  BAD_REQUEST: 40000,
  VALIDATION_ERROR: 40001,
  NOT_FOUND: 40002,
  FORBIDDEN: 40003,
  UNAUTHORIZED: 40004,
  CONFLICT: 40900,
  DUPLICATE_RESOURCE: 40901,
  INTERNAL_ERROR: 50000,
} as const;

/** 不包装为 { code, data, message } 的路径前缀 */
const SKIP_PATHS = [
  '/docs',
  '/redoc',
  '/openapi.json',
  '/health',
  '/api/v1/webhooks',
];

export function shouldSkipResponseWrap(path: string): boolean {
  const p = path.split('?')[0] ?? path;
  return SKIP_PATHS.some((skip) => p === skip || p.startsWith(skip + '/'));
}
