import { z } from 'zod';

export const pricingItemSchema = z.object({
  months: z.number().min(1, '月数最小为1'),
  price: z.number().min(0, '价格不能为负'),
  is_active: z.boolean(),
  is_purchasable: z.boolean(),
  sort_order: z.number(),
});

export const planCreateSchema = z.object({
  name: z.string().min(1, '请输入服务名称'),
  code: z.string().min(1, '请输入服务代码'),
  description: z.string().optional(),
  max_organizations: z.coerce.number().min(-1, '-1 表示无限制'),
  max_apartments: z.coerce.number().min(-1, '-1 表示无限制'),
  max_rooms: z.coerce.number().min(-1, '-1 表示无限制'),
  max_members: z.coerce.number().min(-1, '-1 表示无限制'),
  is_purchasable: z.boolean(),
  sort_order: z.coerce.number().min(0),
  pricing: z.array(pricingItemSchema).min(1, '至少需要一个周期定价'),
});

export const planUpdateSchema = planCreateSchema.extend({
  is_active: z.boolean(),
});

export type PlanCreateForm = z.infer<typeof planCreateSchema>;
export type PlanUpdateForm = z.infer<typeof planUpdateSchema>;
