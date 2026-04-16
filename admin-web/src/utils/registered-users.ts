import type {
  AdminPlan,
  AdminPlanPricingCreate,
  AdminRegisteredUserDetail,
} from '@/api/admin-client';
import type { FilterActive, GiftSubscriptionForm } from '@/schemas/registered-users';

export function getRegisteredUsersActiveParam(activeFilter: FilterActive) {
  if (activeFilter === 'all') {
    return undefined;
  }

  return activeFilter === 'active';
}

export function getGiftEligiblePlans(plans: AdminPlan[]) {
  return plans.filter((plan) => plan.is_active && plan.code !== 'free' && (plan.pricing?.length ?? 0) > 0);
}

export function getDefaultGiftFormValues(detail?: AdminRegisteredUserDetail | null) {
  return {
    organization_id: detail?.organizations[0]?.id ?? '',
    service_id: '',
    pricing_id: '',
    gift_months: 0,
  };
}

export function getSelectedGiftPlan(plans: AdminPlan[], serviceId: string) {
  return plans.find((plan) => plan.id === serviceId) ?? null;
}

export function getSelectedPricing(pricing: AdminPlanPricingCreate[] | undefined, pricingId: string) {
  return pricing?.find((item) => 'id' in item && item.id === pricingId) ?? null;
}

export function buildGiftSubscriptionPayload(
  values: GiftSubscriptionForm,
  plans: AdminPlan[]
) {
  const pricing =
    plans.find((plan) => plan.id === values.service_id)?.pricing?.find((item) => item.id === values.pricing_id) ??
    null;

  if (!pricing) {
    throw new Error('请选择赠送周期');
  }

  return {
    organization_id: values.organization_id,
    service_id: values.service_id,
    pricing_id: values.pricing_id,
    billing_months: pricing.months,
    gift_months: values.gift_months,
  };
}
