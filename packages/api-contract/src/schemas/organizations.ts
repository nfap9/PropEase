/**
 * 组织相关 schemas
 */
import { z } from 'zod';

export const OrganizationCreateSchema = z.object({
  name: z.string().min(1, '请输入团队名称'),
  slug: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export const OrganizationUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  settings: z.record(z.unknown()).optional(),
  notes: z.string().max(1000).optional(),
});

export const ConfirmDeleteSchema = z.object({
  confirmed_name: z.string().min(1),
});

export type OrganizationFormData = z.infer<typeof OrganizationCreateSchema>;
