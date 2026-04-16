import { createI18n } from '@apartment-ultra/shared-ui/lib/i18n';
import { tenantZhCNMessages } from './messages/zh-CN';

export const tenantLocale = 'zh-CN';
export const tenantMessages = tenantZhCNMessages;
export const tenantI18n = createI18n(tenantMessages);

export type TenantMessages = typeof tenantMessages;
