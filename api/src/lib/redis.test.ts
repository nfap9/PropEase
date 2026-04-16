import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTokenRemainingTtl } from '../utils/jwt.js';
import { createAccessToken } from '../utils/jwt.js';

describe('jwt - getTokenRemainingTtl', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns remaining TTL in seconds', () => {
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    // Access token expires in 30 minutes by default
    const token = createAccessToken({ sub: 'user-1' });
    const ttl = getTokenRemainingTtl(token);
    // 30 minutes = 1800 seconds, allow some tolerance
    expect(ttl).toBeGreaterThan(1790);
    expect(ttl).toBeLessThanOrEqual(1800);
  });

  it('returns 0 for invalid token', () => {
    expect(getTokenRemainingTtl('invalid-token')).toBe(0);
  });

  it('returns 0 for expired token', () => {
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    const token = createAccessToken({ sub: 'user-1' });
    // Advance time past the token expiration (30 min + 1 sec)
    vi.advanceTimersByTime(31 * 60 * 1000);
    expect(getTokenRemainingTtl(token)).toBe(0);
  });
});
