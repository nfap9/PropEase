import type { CustomRole } from '@prisma/client';
import type { CustomRoleRepository } from '../repositories/customRole.repo.js';
import { defaultCustomRoleRepo } from '../repositories/customRole.repo.js';
import { createAppError } from '../utils/appError.js';
import { NotFoundMessages } from '../messages.js';
import { ulid } from 'ulid';
import { compareBooleanDesc, compareNaturalText } from '../utils/intuitiveSort.js';

/**
 * 创建角色输入
 */
export interface CreateCustomRoleInput {
  name: string;
  description?: string;
  permissions?: string;
}

/**
 * 更新角色输入
 */
export interface UpdateCustomRoleInput {
  name?: string;
  description?: string;
  permissions?: string;
  is_active?: boolean;
}

/**
 * 初始化默认角色
 */
const DEFAULT_ROLES = [
  { name: '管理员', description: '组织管理员' },
  { name: '财务', description: '财务人员' },
  { name: '运营', description: '运营人员' },
];

/**
 * CustomRole Service 接口
 */
export interface CustomRoleService {
  list(orgId: string): Promise<CustomRole[]>;
  initDefaultRoles(orgId: string): Promise<{ alreadyInitialized: boolean }>;
  create(orgId: string, data: CreateCustomRoleInput): Promise<CustomRole>;
  getById(orgId: string, id: string): Promise<CustomRole>;
  update(orgId: string, id: string, data: UpdateCustomRoleInput): Promise<CustomRole>;
  delete(orgId: string, id: string): Promise<void>;
}

/**
 * 创建 CustomRole Service 实例
 */
export function createCustomRoleService(
  getRepo: () => CustomRoleRepository = () => defaultCustomRoleRepo
): CustomRoleService {
  return {
    list: async (orgId: string) => {
      const roles = await getRepo().findByOrgId(orgId);
      return [...roles].sort(
        (left, right) =>
          compareBooleanDesc(left.is_active, right.is_active) ||
          compareNaturalText(left.name, right.name)
      );
    },

    initDefaultRoles: async (orgId: string) => {
      const existing = await getRepo().countByOrgId(orgId);
      if (existing > 0) {
        return { alreadyInitialized: true };
      }

      for (const d of DEFAULT_ROLES) {
        await getRepo().create({
          id: ulid().toLowerCase(),
          organization_id: orgId,
          name: d.name,
          description: d.description,
        });
      }

      return { alreadyInitialized: false };
    },

    create: async (orgId: string, data: CreateCustomRoleInput) => {
      return getRepo().create({
        id: ulid().toLowerCase(),
        organization_id: orgId,
        name: data.name,
        description: data.description,
        permissions: data.permissions,
      });
    },

    getById: async (orgId: string, id: string) => {
      const role = await getRepo().findByIdAndOrg(id, orgId);
      if (!role) {
        throw createAppError(404, NotFoundMessages.CUSTOM_ROLE);
      }
      return role;
    },

    update: async (orgId: string, id: string, data: UpdateCustomRoleInput) => {
      const existing = await getRepo().findByIdAndOrg(id, orgId);
      if (!existing) {
        throw createAppError(404, NotFoundMessages.CUSTOM_ROLE);
      }

      const updateData: Record<string, unknown> = {};
      if (data.name != null) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.permissions !== undefined) updateData.permissions = data.permissions;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;

      return getRepo().update(id, updateData);
    },

    delete: async (orgId: string, id: string) => {
      const existing = await getRepo().findByIdAndOrg(id, orgId);
      if (!existing) {
        throw createAppError(404, NotFoundMessages.CUSTOM_ROLE);
      }
      await getRepo().delete(id);
    },
  };
}

/**
 * 默认实例
 */
export const defaultCustomRoleService = createCustomRoleService();
