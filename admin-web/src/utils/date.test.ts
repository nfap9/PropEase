import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime } from './date';

describe('date utils', () => {
  describe('formatDate', () => {
    it('formats ISO string to yyyy-MM-dd', () => {
      expect(formatDate('2026-01-15')).toBe('2026-01-15');
      expect(formatDate('2026-12-31')).toBe('2026-12-31');
    });

    it('returns dash for invalid input', () => {
      expect(formatDate(null)).toBe('—');
      expect(formatDate(undefined)).toBe('—');
      expect(formatDate('')).toBe('—');
      expect(formatDate('not-a-date')).toBe('—');
    });

    it('handles Date object', () => {
      expect(formatDate(new Date('2026-04-24'))).toBe('2026-04-24');
    });
  });

  describe('formatDateTime', () => {
    it('formats ISO string to yyyy-MM-dd HH:mm', () => {
      expect(formatDateTime('2026-04-24T10:30:00')).toBe('2026-04-24 10:30');
    });

    it('returns dash for invalid input', () => {
      expect(formatDateTime(null)).toBe('—');
      expect(formatDateTime(undefined)).toBe('—');
      expect(formatDateTime('')).toBe('—');
    });

    it('handles Date object', () => {
      expect(formatDateTime(new Date('2026-04-24T14:00:00'))).toBe('2026-04-24 14:00');
    });
  });
});
