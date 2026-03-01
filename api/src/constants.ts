import { BusinessCode as ContractBusinessCode } from '@apartment-ultra/api-contract';

/** 业务状态码（与 Python 后端一致，来自共享契约） */
export const BusinessCode = ContractBusinessCode;

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
