/**
 * 运营角色页权限勾选逻辑：按码增删，无「全部权限」单项。
 */
export function togglePermissionCode(
  prev: string[],
  code: string,
  checked: boolean
): string[] {
  if (checked) return prev.includes(code) ? prev : [...prev, code];
  return prev.filter((c) => c !== code);
}
