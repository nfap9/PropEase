import type {
  PricingDiscount,
  StorefrontConfig,
  StorefrontItem,
} from '@/lib/api/admin-client';
import type { StorefrontForm, StorefrontItemForm } from './storefront.schemas';

export const getDefaultStorefrontFormValues = (): StorefrontForm => ({
  name: '',
  code: '',
  is_active: true,
  is_default: false,
});

export const getStorefrontFormValues = (storefront: StorefrontConfig): StorefrontForm => ({
  name: storefront.name,
  code: storefront.code,
  is_active: storefront.is_active,
  is_default: storefront.is_default,
});

export const getDefaultStorefrontItemFormValues = (): StorefrontItemForm => ({
  service_id: '',
  is_visible: true,
  sort_order: 0,
  pricing_discounts: [],
});

export const getStorefrontItemFormValues = (item: StorefrontItem): StorefrontItemForm => ({
  service_id: item.service_id,
  is_visible: item.is_visible,
  sort_order: item.sort_order,
  pricing_discounts: item.pricing_discounts ?? [],
});

export const normalizePricingDiscounts = (
  discounts: StorefrontItemForm['pricing_discounts']
): PricingDiscount[] | undefined => (discounts.length > 0 ? (discounts as PricingDiscount[]) : undefined);

export const formatPricingDiscount = (discount: PricingDiscount): string => {
  if (discount.discount_type === 'gift') {
    return `${discount.months}月:送${discount.gift_months}月`;
  }

  if (discount.discount_type === 'percent') {
    return `${discount.months}月:${(discount.discount_value ?? 0) * 10}折`;
  }

  return `${discount.months}月:减${discount.discount_value}元`;
};

