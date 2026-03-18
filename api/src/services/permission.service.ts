import type { Permission, SystemRoleConfig } from '@prisma/client';
import type { PermissionRepository } from '../repositories/permission.repo.js';
import { defaultPermissionRepo } from '../repositories/permission.repo.js';
import { createAppError } from '../utils/appError.js';
import { ulid } from 'ulid';
import {
  ORG_MEMBER_ROLES,
  DEFAULT_ORG_ROLE_PERMISSIONS,
  toPermissionCodes,
  type SystemRole,
  type OrgMemberRole,
} from '../constants/permissionDefaults.js';
import type { Prisma } from '@prisma/client';

/**
 * 权限响应
 */
export interface PermissionInfo {
  id: string;
  resource: string;
  action: string;
  code: string;
  name: string | null;
  description: string | null;
  created_at: string;
}

/**
 * 角色权限响应
 */
export interface RolePermissionsResult {
  role: string;
  permissions: PermissionInfo[];
}

/**
 * Permission Service 接口
 */
export interface PermissionService {
  // 权限列表
  listAll(): Promise<Permission[]>;
  listGrouped(): Promise<Record<string, Permission[]>>;

  // 组织角色权限
  getRolePermissions(orgId: string, role: OrgMemberRole): Promise<RolePermissionsResult>;
  updateRolePermissions(
    orgId: string,
    role: OrgMemberRole,
    permissionCodes: string[],
    requesterId: string
  ): Promise<void>;

  // 我的权限
  getMyPermissions(
    userId: string,
    orgId: string
  ): Promise<{ permissions: string[]; system_roles: SystemRole[]; is_super_admin: boolean }>;

  // 系统角色
  listSystemRoleConfigs(): Promise<SystemRoleConfig[]>;
  grantSystemRole(userId: string, role: SystemRole, granterId: string): Promise<void>;
  revokeSystemRole(userId: string, role: SystemRole): Promise<void>;
  getMySystemRoles(userId: string): Promise<string[]>;

  // 辅助方法
  isSuperAdmin(userId: string): Promise<boolean>;
}

/**
 * 创建 Permission Service 实例
 */
export function createPermissionService(
  getRepo: () => PermissionRepository = () => defaultPermissionRepo
): PermissionService {
  return {
    listAll: async () => {
      return getRepo().findAll();
    },

    listGrouped: async () => {
      const list = await getRepo().findAll();
      const grouped: Record<string, Permission[]> = {};
      for (const p of list) {
        const key = p.resource;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(p);
      }
      return grouped;
    },

    getRolePermissions: async (orgId: string, role: OrgMemberRole) => {
      if (!ORG_MEMBER_ROLES.includes(role)) {
        throw createAppError(400, '无效的角色');
      }

      const org = await getRepo().findOrgById(orgId);
      if (!org) {
        throw createAppError(404, '组织不存在');
      }

      const settings = (org.settings as Record<string, unknown> | null) ?? {};
      const rolePermissions = (
        settings.role_permissions as Record<string, string[] | undefined> | undefined
      )?.[role];
      const codes =
        Array.isArray(rolePermissions) && rolePermissions.length > 0
          ? rolePermissions
          : toPermissionCodes(DEFAULT_ORG_ROLE_PERMISSIONS[role]);

      const permissions = await getRepo().findByCodes(codes);

      return {
        role,
        permissions: permissions.map((p) => ({
          id: p.id,
          resource: p.resource,
          action: p.action,
          code: p.code,
          name: p.name,
          description: p.description,
          created_at: p.created_at.toISOString(),
        })),
      };
    },

    updateRolePermissions: async (
      orgId: string,
      role: OrgMemberRole,
      permissionCodes: string[],
      requesterId: string
    ) => {
      if (!ORG_MEMBER_ROLES.includes(role)) {
        throw createAppError(400, '无效的角色');
      }

      // 检查权限
      const memberRole = await getRepo().findMemberRole(orgId, requesterId);
      if (memberRole !== 'owner') {
        throw createAppError(403, '仅组织所有者可修改角色权限');
      }

      // 验证权限码
      const validCodes = await getRepo().findByCodes(permissionCodes);
      const validSet = new Set(validCodes.map((p) => p.code));
      const codes = permissionCodes.filter((c) => validSet.has(c));

      // 更新组织设置
      const org = await getRepo().findOrgById(orgId);
      if (!org) {
        throw createAppError(404, '组织不存在');
      }

      const settings = (org.settings as Record<string, unknown> | null) ?? {};
      const rolePermissions =
        (settings.role_permissions as Record<string, string[]> | undefined) ?? {};
      rolePermissions[role] = codes;

      await getRepo().updateOrgSettings(orgId, {
        ...settings,
        role_permissions: rolePermissions,
      } as Prisma.InputJsonValue);
    },

    getMyPermissions: async (userId: string, orgId: string) => {
      const systemRoles = (await getRepo().findUserSystemRoles(userId)).map((role) => role.role as SystemRole);
      const isSuperAdmin = systemRoles.includes('super_admin');

      if (isSuperAdmin) {
        const perms = await getRepo().findAll();
        return {
          permissions: perms.map((p) => p.code),
          system_roles: systemRoles,
          is_super_admin: true,
        };
      }

      const memberRole = await getRepo().findMemberRole(orgId, userId);
      if (!memberRole) {
        throw createAppError(403, 'Access denied');
      }

      let permissionCodes: string[];

      if (memberRole === 'owner') {
        const perms = await getRepo().findAll();
        permissionCodes =
          perms.length > 0
            ? perms.map((p) => p.code)
            : toPermissionCodes(DEFAULT_ORG_ROLE_PERMISSIONS.admin);
      } else if (ORG_MEMBER_ROLES.includes(memberRole as OrgMemberRole)) {
        const org = await getRepo().findOrgById(orgId);
        if (!org) {
          throw createAppError(404, '组织不存在');
        }

        const settings = (org.settings as Record<string, unknown> | null) ?? {};
        const rolePermissions = (
          settings.role_permissions as Record<string, string[] | undefined> | undefined
        )?.[memberRole];

        permissionCodes =
          Array.isArray(rolePermissions) && rolePermissions.length > 0
            ? rolePermissions
            : toPermissionCodes(DEFAULT_ORG_ROLE_PERMISSIONS[memberRole as OrgMemberRole]);
      } else {
        permissionCodes = [];
      }

      return {
        permissions: [...new Set(permissionCodes)],
        system_roles: systemRoles,
        is_super_admin: false,
      };
    },

    listSystemRoleConfigs: async () => {
      return getRepo().findAllSystemRoleConfigs();
    },

    grantSystemRole: async (userId: string, role: SystemRole, granterId: string) => {
      await getRepo().upsertUserSystemRole({
        id: ulid().toLowerCase(),
        user_id: userId,
        role,
        granted_by: granterId,
        granted_at: new Date(),
      });
    },

    revokeSystemRole: async (userId: string, role: SystemRole) => {
      await getRepo().deleteUserSystemRole(userId, role);
    },

    getMySystemRoles: async (userId: string) => {
      const roles = await getRepo().findUserSystemRoles(userId);
      return roles.map((r) => r.role);
    },

    isSuperAdmin: async (userId: string) => {
      return getRepo().hasSystemRole(userId, 'super_admin');
    },
  };
}

/**
 * 默认实例
 */
export const defaultPermissionService = createPermissionService();
