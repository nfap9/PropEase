import { z } from 'zod';
import { adminMessages } from '@/lib/i18n';

export type FilterActive = 'all' | 'active' | 'inactive';

export const giftSubscriptionSchema = z.object({
  organization_id: z.string().min(1, adminMessages.registeredUsers.validation.organizationRequired),
  service_id: z.string().min(1, adminMessages.registeredUsers.validation.serviceRequired),
  pricing_id: z.string().min(1, adminMessages.registeredUsers.validation.pricingRequired),
  gift_months: z.coerce
    .number()
    .int()
    .min(0, adminMessages.registeredUsers.validation.extraMonthsMin)
    .max(24, adminMessages.registeredUsers.validation.extraMonthsMax),
});

export type GiftSubscriptionForm = z.infer<typeof giftSubscriptionSchema>;
