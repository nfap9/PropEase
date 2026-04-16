import { createI18n } from '@apartment-ultra/shared-ui/lib/i18n';
import { adminZhCNMessages } from './messages/zh-CN';

export const adminLocale = 'zh-CN';
export const adminMessages = adminZhCNMessages;
export const adminI18n = createI18n(adminMessages);

export type AdminMessages = typeof adminMessages;
