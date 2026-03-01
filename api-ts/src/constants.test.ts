import { describe, it, expect } from 'vitest';
import { BusinessCode, shouldSkipResponseWrap } from './constants.js';

describe('constants', () => {
  it('BusinessCode.SUCCESS is 0', () => {
    expect(BusinessCode.SUCCESS).toBe(0);
  });

  it('shouldSkipResponseWrap skips /health and /api/v1/webhooks', () => {
    expect(shouldSkipResponseWrap('/health')).toBe(true);
    expect(shouldSkipResponseWrap('/api/v1/webhooks/wechat-pay')).toBe(true);
    expect(shouldSkipResponseWrap('/api/v1/auth/login')).toBe(false);
  });
});
