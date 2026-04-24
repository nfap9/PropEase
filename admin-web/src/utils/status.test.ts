import { describe, expect, it } from 'vitest';
import {
  ORG_STATUS_CONFIG,
  BOOLEAN_YES_NO_CONFIG,
} from './status';

describe('status utils', () => {
  describe('ORG_STATUS_CONFIG', () => {
    it('has active and inactive entries', () => {
      expect(ORG_STATUS_CONFIG.active.label).toBe('启用');
      expect(ORG_STATUS_CONFIG.active.variant).toBe('success');
      expect(ORG_STATUS_CONFIG.inactive.label).toBe('停用');
      expect(ORG_STATUS_CONFIG.inactive.variant).toBe('secondary');
    });
  });

  describe('BOOLEAN_YES_NO_CONFIG', () => {
    it('has yes and no entries', () => {
      expect(BOOLEAN_YES_NO_CONFIG.yes.label).toBe('是');
      expect(BOOLEAN_YES_NO_CONFIG.yes.variant).toBe('secondary');
      expect(BOOLEAN_YES_NO_CONFIG.no.label).toBe('否');
      expect(BOOLEAN_YES_NO_CONFIG.no.variant).toBe('outline');
    });
  });
});
