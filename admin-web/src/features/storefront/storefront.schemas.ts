import { z } from 'zod';

export const storefrontCreateSchema = z.object({
  name: z.string().min(1, '请输入商店名称'),
  code: z.string().min(1, '请输入商店代码'),
  is_active: z.boolean(),
  is_default: z.boolean(),
});

export const storefrontUpdateSchema = storefrontCreateSchema;

export type StorefrontForm = z.infer<typeof storefrontCreateSchema>;

export const discountSchema = z.object({
  months: z.number().min(1),
  discount_type: z.enum(['percent', 'fixed', 'gift']),
  discount_value: z.number().nullable(),
  gift_months: z.number().nullable(),
});

export const storefrontItemSchema = z.object({
  service_id: z.string().min(1, '请选择服务'),
  is_visible: z.boolean(),
  sort_order: z.number(),
  pricing_discounts: z.array(discountSchema),
});

export type StorefrontItemForm = z.infer<typeof storefrontItemSchema>;

export const DISCOUNT_TYPE_CONFIG = {
  percent: { label: '打折', description: '如 0.8 表示 8 折' },
  fixed: { label: '立减', description: '立减金额（元）' },
  gift: { label: '赠送', description: '购买后赠送时长' },
} as const;
