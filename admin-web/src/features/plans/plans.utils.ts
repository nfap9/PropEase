import type {
  AdminPlan,
  AdminPlanCreate,
  AdminPlanPricingCreate,
  AdminPlanUpdate,
} from '@/lib/api/admin-client';
import type { PlanCreateForm, PlanUpdateForm } from './plans.schemas';

const DEFAULT_PRICING_ITEM = {
  months: 1,
  price: 0,
  is_active: true,
  is_purchasable: true,
  sort_order: 0,
};

export function getDefaultPlanCreateFormValues(): PlanCreateForm {
  return {
    name: '',
    code: '',
    description: '',
    max_organizations: 1,
    max_apartments: 1,
    max_rooms: 100,
    max_members: 1,
    is_purchasable: true,
    sort_order: 0,
    pricing: [{ ...DEFAULT_PRICING_ITEM }],
  };
}

export function getPlanUpdateFormValues(plan: AdminPlan): PlanUpdateForm {
  return {
    name: plan.name,
    code: plan.code,
    description: plan.description ?? '',
    max_organizations: plan.max_organizations ?? -1,
    max_apartments: plan.max_apartments,
    max_rooms: plan.max_rooms,
    max_members: plan.max_members,
    is_purchasable: plan.is_purchasable ?? true,
    sort_order: plan.sort_order,
    is_active: plan.is_active,
    pricing:
      plan.pricing && plan.pricing.length > 0
        ? plan.pricing.map((pricing) => ({
            months: pricing.months,
            price: Number(pricing.price),
            is_active: pricing.is_active,
            is_purchasable: pricing.is_purchasable ?? true,
            sort_order: pricing.sort_order,
          }))
        : [{ ...DEFAULT_PRICING_ITEM }],
  };
}

export function toPlanCreatePayload(data: PlanCreateForm): AdminPlanCreate {
  return {
    name: data.name,
    code: data.code,
    description: data.description || undefined,
    max_organizations: data.max_organizations === -1 ? null : data.max_organizations,
    max_apartments: data.max_apartments,
    max_rooms: data.max_rooms,
    max_members: data.max_members,
    is_purchasable: data.is_purchasable,
    sort_order: data.sort_order,
    pricing: data.pricing,
  };
}

export function toPlanUpdatePayload(data: PlanUpdateForm): AdminPlanUpdate {
  return {
    name: data.name,
    description: data.description || null,
    max_organizations: data.max_organizations === -1 ? null : data.max_organizations,
    max_apartments: data.max_apartments,
    max_rooms: data.max_rooms,
    max_members: data.max_members,
    is_active: data.is_active,
    is_purchasable: data.is_purchasable,
    sort_order: data.sort_order,
  };
}

export function toPlanPricingPayload(data: PlanUpdateForm): AdminPlanPricingCreate[] {
  return data.pricing;
}

export function formatPlanPricing(plan: AdminPlan) {
  if (!plan.pricing || plan.pricing.length === 0) {
    return '-';
  }

  const activePricing = plan.pricing.filter((pricing) => pricing.is_active);
  if (activePricing.length === 0) {
    return '-';
  }

  return activePricing.map((pricing) => `${pricing.months}月¥${pricing.price}`).join(' / ');
}

export function formatPlanLimits(plan: AdminPlan) {
  const organizations =
    plan.max_organizations == null || plan.max_organizations < 0 ? '∞' : plan.max_organizations;
  const apartments = plan.max_apartments < 0 ? '∞' : plan.max_apartments;
  const rooms = plan.max_rooms < 0 ? '∞' : plan.max_rooms;
  const members = plan.max_members < 0 ? '∞' : plan.max_members;

  return `组织${organizations} / 公寓${apartments} / 房间${rooms} / 成员${members}`;
}
