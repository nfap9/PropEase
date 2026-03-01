/**
 * 运营角色页权限勾选逻辑：与「全部权限」互斥。
 */
export function togglePermissionCode(
  prev: string[],
  code: string,
  checked: boolean
): string[] {
  if (code === '*') return checked ? ['*'] : [];
  const next = prev.filter((c) => c !== '*');
  if (checked) return next.includes(code) ? next : [...next, code];
  return next.filter((c) => c !== code);
}
