import { z } from 'zod';
import { adminMessages } from '@/lib/i18n';

export const pricingItemSchema = z.object({
  months: z.number().min(1, adminMessages.plans.validation.minMonths),
  price: z.number().min(0, adminMessages.plans.validation.negativePrice),
  is_active: z.boolean(),
  is_purchasable: z.boolean(),
  sort_order: z.number(),
});

export const planCreateSchema = z.object({
  name: z.string().min(1, adminMessages.plans.validation.nameRequired),
  code: z.string().min(1, adminMessages.plans.validation.codeRequired),
  description: z.string().optional(),
  max_organizations: z.coerce.number().min(-1, adminMessages.plans.validation.unlimitedHint),
  max_apartments: z.coerce.number().min(-1, adminMessages.plans.validation.unlimitedHint),
  max_rooms: z.coerce.number().min(-1, adminMessages.plans.validation.unlimitedHint),
  max_members: z.coerce.number().min(-1, adminMessages.plans.validation.unlimitedHint),
  is_purchasable: z.boolean(),
  sort_order: z.coerce.number().min(0),
  pricing: z.array(pricingItemSchema).min(1, adminMessages.plans.validation.pricingRequired),
});

export const planUpdateSchema = planCreateSchema.extend({
  is_active: z.boolean(),
});

export type PlanCreateForm = z.infer<typeof planCreateSchema>;
export type PlanUpdateForm = z.infer<typeof planUpdateSchema>;
