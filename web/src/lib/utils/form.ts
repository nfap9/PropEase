/**
 * 过滤对象中的空字符串，避免后端验证错误
 * 将空字符串 '' 转换为 undefined（从对象中移除）
 */
export function filterEmptyStrings<T extends Record<string, unknown>>(
  data: T
): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== '')
  ) as Partial<T>;
}
