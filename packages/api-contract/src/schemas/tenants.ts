/**
 * 租客表单 schemas
 * 前后端共享，统一校验规则
 */
import { z } from 'zod';

export const TenantCreateSchema = z.object({
  name: z.string().min(1, '请输入租客姓名'),
  phone: z.string().min(1, '请输入联系电话'),
  id_card: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  notes: z.string().optional(),
});

export const TenantUpdateSchema = TenantCreateSchema.partial();

/** 前端表单数据结构（包含 optional 字段完整结构） */
export type TenantFormData = z.infer<typeof TenantCreateSchema>;
