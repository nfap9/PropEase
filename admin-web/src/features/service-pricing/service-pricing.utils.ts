import type {
  ServicePricingCreate,
  ServiceProduct,
  ServiceProductCreate,
  ServiceProductUpdate,
} from '@/lib/api/admin-client';
import type { ServiceProductForm } from './service-pricing.schemas';

export const getDefaultServiceProductFormValues = (): ServiceProductForm => ({
  name: '',
  code: '',
  description: '',
  max_organizations: 1,
  max_apartments: 1,
  max_rooms: 100,
  max_members: 1,
  is_active: true,
  sort_order: 0,
  pricing: [{ months: 1, price: 0, is_active: true, sort_order: 0 }],
});

export const getServiceProductFormValues = (service: ServiceProduct): ServiceProductForm => ({
  name: service.name,
  code: service.code,
  description: service.description ?? '',
  max_organizations: service.max_organizations,
  max_apartments: service.max_apartments,
  max_rooms: service.max_rooms,
  max_members: service.max_members,
  is_active: service.is_active,
  sort_order: service.sort_order,
  pricing:
    service.pricing && service.pricing.length > 0
      ? service.pricing.map((pricing) => ({
          months: pricing.months,
          price: Number(pricing.price),
          is_active: pricing.is_active,
          sort_order: pricing.sort_order,
        }))
      : [{ months: 1, price: 0, is_active: true, sort_order: 0 }],
});

export const toServiceProductCreatePayload = (
  data: ServiceProductForm
): ServiceProductCreate => ({
  name: data.name,
  code: data.code,
  description: data.description || undefined,
  max_organizations: data.max_organizations ?? undefined,
  max_apartments: data.max_apartments,
  max_rooms: data.max_rooms,
  max_members: data.max_members,
  is_active: data.is_active,
  sort_order: data.sort_order,
  pricing: data.pricing,
});

export const toServiceProductUpdatePayload = (
  data: ServiceProductForm
): ServiceProductUpdate => ({
  name: data.name,
  description: data.description || undefined,
  max_organizations: data.max_organizations ?? undefined,
  max_apartments: data.max_apartments,
  max_rooms: data.max_rooms,
  max_members: data.max_members,
  is_active: data.is_active,
  sort_order: data.sort_order,
});

export const toServicePricingPayload = (data: ServiceProductForm): ServicePricingCreate[] =>
  data.pricing ?? [];
