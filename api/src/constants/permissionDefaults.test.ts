import { describe, it, expect } from 'vitest';
import {
  RESOURCES,
  ACTIONS,
  RESOURCE_MODULES,
  ACTION_TYPES,
  SYSTEM_ORG_ROLES,
  toPermissionCode,
  DEFAULT_ORG_ROLE_PERMISSIONS,
  DEFAULT_ORG_ROLES,
  type ResourceModule,
  type ActionType,
  type SystemOrgRoleName,
} from './permissionDefaults.js';

describe('permissionDefaults', () => {
  describe('RESOURCES', () => {
    it('contains expected resource values', () => {
      expect(RESOURCES).toContain('apartment');
      expect(RESOURCES).toContain('tenant');
      expect(RESOURCES).toContain('bill');
    });
  });

  describe('ACTIONS', () => {
    it('contains expected action values', () => {
      expect(ACTIONS).toContain('view');
      expect(ACTIONS).toContain('create');
      expect(ACTIONS).toContain('edit');
      expect(ACTIONS).toContain('delete');
      expect(ACTIONS).toContain('export');
    });
  });

  describe('toPermissionCode', () => {
    it('returns resource:action format', () => {
      expect(toPermissionCode('apartment', 'view')).toBe('apartment:view');
      expect(toPermissionCode('bill', 'export')).toBe('bill:export');
    });
  });

  describe('DEFAULT_ORG_ROLE_PERMISSIONS', () => {
    it('组织所有者 has all resource×action combinations', () => {
      const perms = DEFAULT_ORG_ROLE_PERMISSIONS['组织所有者'];
      expect(perms.length).toBeGreaterThan(0);
      // 9 resources × 5 actions = 45
      expect(perms).toHaveLength(45);
    });

    it('each system role has at least one permission', () => {
      const roles: SystemOrgRoleName[] = ['组织所有者', '公寓管理人', '一般合伙人'];
      for (const role of roles) {
        expect(DEFAULT_ORG_ROLE_PERMISSIONS[role].length).toBeGreaterThan(0);
      }
    });
  });

  describe('DEFAULT_ORG_ROLES', () => {
    it('has 3 default roles', () => {
      expect(DEFAULT_ORG_ROLES).toHaveLength(3);
    });

    it('each role has name and permissions', () => {
      for (const role of DEFAULT_ORG_ROLES) {
        expect(role.name).toBeDefined();
        expect(role.is_system).toBe(true);
        expect(role.permissions.length).toBeGreaterThan(0);
      }
    });
  });
});
