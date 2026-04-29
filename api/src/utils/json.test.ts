import { describe, expect, it } from 'vitest';
import { toPrismaInputJsonValue } from './json.js';

describe('toPrismaInputJsonValue', () => {
  it('should normalize nested objects and arrays', () => {
    expect(
      toPrismaInputJsonValue({
        name: 'config',
        enabled: true,
        discounts: [
          {
            months: 12,
            discount_type: 'percent',
            discount_value: 0.8,
            gift_months: null,
          },
        ],
      })
    ).toEqual({
      name: 'config',
      enabled: true,
      discounts: [
        {
          months: 12,
          discount_type: 'percent',
          discount_value: 0.8,
          gift_months: null,
        },
      ],
    });
  });

  it('should omit undefined object properties', () => {
    expect(
      toPrismaInputJsonValue({
        app_name: 'Apartment Ultra',
        favicon_url: undefined,
      })
    ).toEqual({
      app_name: 'Apartment Ultra',
    });
  });

  it('should reject top-level null values', () => {
    expect(() => toPrismaInputJsonValue(null)).toThrow('Top-level JSON value cannot be null');
  });
});
