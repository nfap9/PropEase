/**
 * 统一的日期时间格式化工具
 * 使用 date-fns 确保前端所有时间显示格式一致
 */
import { format, isValid, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/** 日期格式：yyyy-MM-dd，用于纯日期显示（租约、账单到期日等） */
const DATE_FORMAT = 'yyyy-MM-dd';

/** 日期时间格式：yyyy-MM-dd HH:mm，用于带时间的场景（创建时间、登录时间等） */
const DATETIME_FORMAT = 'yyyy-MM-dd HH:mm';

/**
 * 解析日期输入（字符串或 Date），无效时返回 null
 */
function parseDate(input: string | Date | null | undefined): Date | null {
  if (input == null) return null;
  if (input instanceof Date) return isValid(input) ? input : null;
  const parsed = parseISO(input as string);
  return isValid(parsed) ? parsed : null;
}

/**
 * 格式化日期（仅日期，无时间）
 * @example formatDate('2024-01-15') => '2024-01-15'
 */
export function formatDate(input: string | Date | null | undefined): string {
  const d = parseDate(input);
  if (!d) return '—';
  return format(d, DATE_FORMAT, { locale: zhCN });
}

/**
 * 格式化日期时间（日期 + 时间）
 * @example formatDateTime('2024-01-15T10:30:00Z') => '2024-01-15 10:30'
 */
export function formatDateTime(input: string | Date | null | undefined): string {
  const d = parseDate(input);
  if (!d) return '—';
  return format(d, DATETIME_FORMAT, { locale: zhCN });
}
