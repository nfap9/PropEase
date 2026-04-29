import { describe, expect, it } from 'vitest';
import { getPricingSummary } from './pricing';

describe('getPricingSummary', () => {
  it('falls back to safe numeric defaults when pricing is null', () => {
    const summary = getPricingSummary(null);

    expect(summary.originalPrice.toFixed(2)).toBe('0.00');
    expect(summary.finalPrice.toFixed(2)).toBe('0.00');
    expect(summary.discountAmount.toFixed(2)).toBe('0.00');
    expect(summary.giftMonths).toBe(0);
  });

  it('returns original price as final price when no discount', () => {
    const summary = getPricingSummary({
      id: 'pricing-monthly',
      service_id: 'svc-1',
      months: 1,
      price: 99,
      is_active: true,
      sort_order: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    });

    expect(summary.originalPrice.toFixed(2)).toBe('99.00');
    expect(summary.finalPrice.toFixed(2)).toBe('99.00');
    expect(summary.discountAmount.toFixed(2)).toBe('0.00');
    expect(summary.giftMonths).toBe(0);
  });

  it('returns correct price for yearly pricing', () => {
    const summary = getPricingSummary({
      id: 'pricing-yearly',
      service_id: 'svc-1',
      months: 12,
      price: 1200,
      is_active: true,
      sort_order: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    });

    expect(summary.originalPrice).toBe(1200);
    expect(summary.finalPrice).toBe(1200);
    expect(summary.discountAmount).toBe(0);
    expect(summary.giftMonths).toBe(0);
  });
});
