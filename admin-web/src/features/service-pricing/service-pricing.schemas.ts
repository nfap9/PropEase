import { z } from 'zod';

export const pricingItemSchema = z.object({
  months: z.number().min(1, '月数最小为1'),
  price: z.number().min(0, '价格不能为负'),
  is_active: z.boolean(),
  sort_order: z.number(),
});

export const serviceProductCreateSchema = z.object({
  name: z.string().min(1, '请输入服务名称'),
  code: z.string().min(1, '请输入服务代码'),
  description: z.string().optional(),
  max_organizations: z.coerce.number().nullable(),
  max_apartments: z.coerce.number().min(1, '公寓数最小为1'),
  max_rooms: z.coerce.number().min(1, '房间数最小为1'),
  max_members: z.coerce.number().min(1, '成员数最小为1'),
  is_active: z.boolean(),
  sort_order: z.coerce.number().min(0),
  pricing: z.array(pricingItemSchema),
});

export const serviceProductUpdateSchema = serviceProductCreateSchema;

export type ServiceProductForm = z.infer<typeof serviceProductCreateSchema>;

