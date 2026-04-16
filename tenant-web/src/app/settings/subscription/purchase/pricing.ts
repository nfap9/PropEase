import type { StorefrontServicePricing } from '@/api/subscriptions';

export interface PricingSummary {
  originalPrice: number;
  finalPrice: number;
  discountAmount: number;
  giftMonths: number;
}

function normalizeMoney(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function getPricingSummary(pricing?: StorefrontServicePricing | null): PricingSummary {
  const originalPrice = normalizeMoney(pricing?.price ?? 0);
  const discount = pricing?.discount;

  let finalPrice = pricing?.final_price;
  if (finalPrice == null && discount?.discount_type === 'percent' && discount.discount_value != null) {
    finalPrice = originalPrice * discount.discount_value;
  } else if (
    finalPrice == null &&
    discount?.discount_type === 'fixed' &&
    discount.discount_value != null
  ) {
    finalPrice = originalPrice - discount.discount_value;
  }

  const normalizedFinalPrice = normalizeMoney(finalPrice ?? originalPrice);
  const discountAmount = normalizeMoney(originalPrice - normalizedFinalPrice);
  const giftMonths =
    discount?.discount_type === 'gift' ? Math.max(0, discount.gift_months ?? 0) : 0;

  return {
    originalPrice,
    finalPrice: normalizedFinalPrice,
    discountAmount,
    giftMonths,
  };
}
