import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createAccessToken,
  createRefreshToken,
  createAdminAccessToken,
  decodeToken,
} from './jwt.js';

describe('jwt', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createAccessToken and decodeToken', () => {
    it('decodeToken returns payload after createAccessToken', () => {
      vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
      const token = createAccessToken({ sub: 'user-1', phone: '13800138000' });
      const payload = decodeToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe('user-1');
      expect(payload?.phone).toBe('13800138000');
      expect(payload?.type).toBe('access');
      expect(typeof payload?.exp).toBe('number');
    });

    it('createRefreshToken payload has type refresh', () => {
      vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
      const token = createRefreshToken({ sub: 'user-1' });
      const payload = decodeToken(token);
      expect(payload?.type).toBe('refresh');
      expect(payload?.sub).toBe('user-1');
    });

    it('createAdminAccessToken payload has type admin', () => {
      vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
      const token = createAdminAccessToken('admin-user-1');
      const payload = decodeToken(token);
      expect(payload?.type).toBe('admin');
      expect(payload?.sub).toBe('admin-user-1');
    });
  });

  describe('decodeToken invalid input', () => {
    it('returns null for non-3-part string', () => {
      expect(decodeToken('')).toBeNull();
      expect(decodeToken('a')).toBeNull();
      expect(decodeToken('a.b')).toBeNull();
    });

    it('returns null for tampered token', () => {
      vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
      const token = createAccessToken({ sub: '1' });
      const parts = token.split('.');
      const tampered = `${parts[0]}.${parts[1]}.wrong-signature`;
      expect(decodeToken(tampered)).toBeNull();
    });

    it('returns null for expired token', () => {
      vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
      const token = createAccessToken({ sub: '1' });
      expect(decodeToken(token)).not.toBeNull();
      vi.advanceTimersByTime(31 * 60 * 1000);
      expect(decodeToken(token)).toBeNull();
    });
  });
});
