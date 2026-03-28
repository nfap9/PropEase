import { z } from 'zod';

export type FilterActive = 'all' | 'active' | 'inactive';

export const giftSubscriptionSchema = z.object({
  organization_id: z.string().min(1, '请选择赠送组织'),
  service_id: z.string().min(1, '请选择服务'),
  pricing_id: z.string().min(1, '请选择赠送周期'),
  gift_months: z.coerce
    .number()
    .int()
    .min(0, '附加赠送月数不能小于 0')
    .max(24, '附加赠送月数不能超过 24'),
});

export type GiftSubscriptionForm = z.infer<typeof giftSubscriptionSchema>;
