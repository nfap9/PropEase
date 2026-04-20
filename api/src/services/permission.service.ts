import type { OrgRole } from '@prisma/client';
import type { PermissionRepository } from '../repositories/permission.repo.js';
import { defaultPermissionRepo } from '../repositories/permission.repo.js';
import { createAppError } from '../utils/appError.js';
import { ulid } from 'ulid';
import {
  RESOURCES,
  ACTIONS,
  RESOURCE_NAMES,
  ACTION_NAMES,
} from '@apartment-ultra/api-contract';
import {
  type Resource,
  type Action,
} from '../constants/permissionDefaults.js';
import type { Prisma } from '@prisma/client';

/**
 * 权限响应
 */
export interface PermissionInfo {
  resource: Resource;
  action: Action;
  code: string;
  name: string;
}

/**
 * 分组权限响应
 */
export interface GroupedPermissions {
  [resource: string]: PermissionInfo[];
}

/**
 * 角色权限响应
 */
export interface RolePermissionsResult {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  permissions: string[];
}

/**
 * 角色列表项（带成员数）
 */
export interface OrgRoleListItem {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  permissions: string[];
  member_count: number;
}

/**
 * Permission Service 接口
 */
export interface PermissionService {
  // 权限列表（静态定义）
  listAll(): PermissionInfo[];
  listGrouped(): GroupedPermissions;

  // 组织角色
  listOrgRoles(orgId: string): Promise<OrgRoleListItem[]>;
  getOrgRole(roleId: string): Promise<OrgRole | null>;
  createOrgRole(orgId: string, name: string, description?: string): Promise<OrgRole>;
  updateOrgRole(
    roleId: string,
    data: { name?: string; description?: string; permissions?: string[] }
  ): Promise<OrgRole>;
  deleteOrgRole(roleId: string, requesterId: string): Promise<void>;
  getRolePermissions(roleId: string): Promise<RolePermissionsResult>;
  updateRolePermissions(
    roleId: string,
    permissionCodes: string[],
    requesterId: string
  ): Promise<void>;

  // 我的权限
  getMyPermissions(userId: string, orgId: string): Promise<string[]>;
}

/**
 * 创建 Permission Service 实例
 */
export function createPermissionService(
  getRepo: () => PermissionRepository = () => defaultPermissionRepo
): PermissionService {
  // 构建静态权限列表
  const allPermissions: PermissionInfo[] = [];
  for (const resource of RESOURCES) {
    for (const action of ACTIONS) {
      allPermissions.push({
        resource,
        action,
        code: `${resource}:${action}`,
        name: `${RESOURCE_NAMES[resource]}${ACTION_NAMES[action]}`,
      });
    }
  }

  return {
    /**
     * 获取所有权限列表（静态定义）
     */
    listAll: () => {
      return allPermissions;
    },

    /**
     * 获取分组权限列表
     */
    listGrouped: () => {
      const grouped: GroupedPermissions = {};
      for (const p of allPermissions) {
        if (!grouped[p.resource]) {
          grouped[p.resource] = [];
        }
        grouped[p.resource].push(p);
      }
      return grouped;
    },

    /**
     * 获取组织角色列表
     */
    listOrgRoles: async (orgId: string) => {
      const roles = await getRepo().findOrgRoles(orgId);
      const items: OrgRoleListItem[] = [];
      for (const role of roles) {
        const memberCount = await getRepo().countRoleMembers(role.id);
        items.push({
          id: role.id,
          name: role.name,
          description: role.description,
          is_system: role.is_system,
          permissions: (role.permissions as string[]) ?? [],
          member_count: memberCount,
        });
      }
      return items;
    },

    /**
     * 获取角色详情
     */
    getOrgRole: async (roleId: string) => {
      return getRepo().findOrgRoleById(roleId);
    },

    /**
     * 创建角色
     */
    createOrgRole: async (orgId: string, name: string, description?: string) => {
      // 检查是否已存在同名角色
      const existing = await getRepo().findOrgRoleByName(orgId, name);
      if (existing) {
        throw createAppError(400, '该角色名称已存在');
      }

      return getRepo().createOrgRole({
        id: ulid().toLowerCase(),
        organization_id: orgId,
        name,
        description,
        is_system: false, // 用户创建的角色不是系统预制
        permissions: [],
      });
    },

    /**
     * 更新角色
     */
    updateOrgRole: async (
      roleId: string,
      data: { name?: string; description?: string; permissions?: string[] }
    ) => {
      const role = await getRepo().findOrgRoleById(roleId);
      if (!role) {
        throw createAppError(404, '角色不存在');
      }

      if (role.is_system) {
        throw createAppError(403, '预制角色不可修改');
      }

      // 如果要更新名称，检查是否与现有角色冲突
      if (data.name && data.name !== role.name) {
        const existing = await getRepo().findOrgRoleByName(role.organization_id, data.name);
        if (existing) {
          throw createAppError(400, '该角色名称已存在');
        }
      }

      return getRepo().updateOrgRole(roleId, {
        name: data.name,
        description: data.description,
        permissions: data.permissions,
      } as { name?: string; description?: string; permissions?: Prisma.InputJsonValue });
    },

    /**
     * 删除角色
     */
    deleteOrgRole: async (roleId: string, _requesterId: string) => {
      const role = await getRepo().findOrgRoleById(roleId);
      if (!role) {
        throw createAppError(404, '角色不存在');
      }

      if (role.is_system) {
        throw createAppError(403, '预制角色不可删除');
      }

      // 检查是否有关联成员
      const memberCount = await getRepo().countRoleMembers(roleId);
      if (memberCount > 0) {
        throw createAppError(400, `该角色已关联 ${memberCount} 个账号，无法删除`);
      }

      await getRepo().deleteOrgRole(roleId);
    },

    /**
     * 获取角色权限
     */
    getRolePermissions: async (roleId: string) => {
      const role = await getRepo().findOrgRoleById(roleId);
      if (!role) {
        throw createAppError(404, '角色不存在');
      }

      return {
        id: role.id,
        name: role.name,
        description: role.description,
        is_system: role.is_system,
        permissions: (role.permissions as string[]) ?? [],
      };
    },

    /**
     * 更新角色权限
     */
    updateRolePermissions: async (
      roleId: string,
      permissionCodes: string[],
      _requesterId: string
    ) => {
      const role = await getRepo().findOrgRoleById(roleId);
      if (!role) {
        throw createAppError(404, '角色不存在');
      }

      if (role.is_system) {
        throw createAppError(403, '预制角色不可修改权限');
      }

      // 验证权限码是否有效
      const validCodes = new Set(allPermissions.map((p) => p.code));
      const codes = permissionCodes.filter((c) => validCodes.has(c));

      await getRepo().updateOrgRole(roleId, {
        permissions: codes as Prisma.InputJsonValue,
      });
    },

    /**
     * 获取我的权限
     */
    getMyPermissions: async (userId: string, orgId: string) => {
      const member = await getRepo().findMemberWithRole(orgId, userId);
      if (!member) {
        return [];
      }

      return (member.role.permissions as string[]) ?? [];
    },
  };
}

/**
 * 默认实例
 */
export const defaultPermissionService = createPermissionService();
