import { describe, expect, it } from 'vitest';
import { getPricingSummary } from './pricing';

describe('getPricingSummary', () => {
  it('falls back to safe numeric defaults when storefront pricing has no discount fields', () => {
    const summary = getPricingSummary({
      id: 'pricing-monthly',
      months: 1,
      price: 99,
    });

    expect(summary.originalPrice.toFixed(2)).toBe('99.00');
    expect(summary.finalPrice.toFixed(2)).toBe('99.00');
    expect(summary.discountAmount.toFixed(2)).toBe('0.00');
    expect(summary.giftMonths).toBe(0);
  });

  it('derives fixed discounts from the storefront discount payload', () => {
    const summary = getPricingSummary({
      id: 'pricing-quarterly',
      months: 3,
      price: 300,
      discount: {
        discount_type: 'fixed',
        discount_value: 45,
        gift_months: null,
      },
    });

    expect(summary.finalPrice).toBe(255);
    expect(summary.discountAmount).toBe(45);
  });

  it('keeps gift promotions free of fake monetary discounts', () => {
    const summary = getPricingSummary({
      id: 'pricing-yearly',
      months: 12,
      price: 1200,
      discount: {
        discount_type: 'gift',
        discount_value: null,
        gift_months: 2,
      },
    });

    expect(summary.finalPrice).toBe(1200);
    expect(summary.discountAmount).toBe(0);
    expect(summary.giftMonths).toBe(2);
  });
});
