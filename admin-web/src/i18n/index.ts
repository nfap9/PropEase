import { adminZhCNMessages } from './messages/zh-CN';

export const adminLocale = 'zh-CN';
export const adminMessages = adminZhCNMessages;

export type AdminMessages = typeof adminMessages;

// Simple i18n implementation
type NestedKeyOf<T> = T extends object
  ? { [K in keyof T]: K extends string ? (T[K] extends object ? `${K}.${NestedKeyOf<T[K]>}` : K) : never }[keyof T]
  : never;

type MessageKey = NestedKeyOf<AdminMessages>;

function getNestedValue(obj: unknown, path: string): string {
  const keys = path.split('.');
  let result: unknown = obj;
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  return typeof result === 'string' ? result : path;
}

export const adminI18n = {
  t: (key: string, params?: Record<string, string | number>): string => {
    let message = getNestedValue(adminMessages, key);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        message = message.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return message;
  },
};
