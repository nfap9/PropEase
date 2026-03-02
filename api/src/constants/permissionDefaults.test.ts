import { describe, it, expect } from 'vitest';
import {
  RESOURCES,
  getPermissionName,
  DEFAULT_SYSTEM_ROLE_PERMISSIONS,
  type SystemRole,
} from './permissionDefaults.js';

describe('permissionDefaults', () => {
  describe('getPermissionName', () => {
    it('returns resource name + action name for apartment view', () => {
      expect(getPermissionName('apartment', 'view')).toBe('公寓管理查看');
    });

    it('returns correct string for bill export', () => {
      expect(getPermissionName('bill', 'export')).toBe('账单管理导出');
    });
  });

  describe('DEFAULT_SYSTEM_ROLE_PERMISSIONS', () => {
    it('super_admin has all resource×action combinations (view, create, edit, delete, export)', () => {
      const perms = DEFAULT_SYSTEM_ROLE_PERMISSIONS.super_admin;
      const expectedSize = RESOURCES.length * 5;
      expect(perms).toHaveLength(expectedSize);
      const set = new Set(perms.map((p) => `${p.resource}:${p.action}`));
      for (const r of RESOURCES) {
        for (const a of ['view', 'create', 'edit', 'delete', 'export'] as const) {
          expect(set.has(`${r}:${a}`)).toBe(true);
        }
      }
    });

    it('each system role has at least one permission', () => {
      const roles: SystemRole[] = ['super_admin', 'support', 'operations', 'finance', 'readonly'];
      for (const role of roles) {
        expect(DEFAULT_SYSTEM_ROLE_PERMISSIONS[role].length).toBeGreaterThan(0);
      }
    });
  });
});
