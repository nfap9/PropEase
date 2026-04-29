import type { ServicePricing } from '@apartment-ultra/api-contract';

export interface PricingSummary {
  originalPrice: number;
  finalPrice: number;
  discountAmount: number;
  giftMonths: number;
}

function normalizeMoney(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function getPricingSummary(pricing?: ServicePricing | null): PricingSummary {
  const originalPrice = normalizeMoney(pricing?.price ?? 0);

  return {
    originalPrice,
    finalPrice: originalPrice,
    discountAmount: 0,
    giftMonths: 0,
  };
}
