import type { Permission, SystemRoleConfig, UserSystemRole, Organization, Prisma } from '@prisma/client';
import type { DbClient } from '../types/repository.types.js';
import { prisma } from '../lib/prisma.js';

/**
 * Permission Repository 接口
 */
export interface PermissionRepository {
  // 权限
  findAll(): Promise<Permission[]>;
  findByCodes(codes: string[]): Promise<Permission[]>;

  // 组织
  findOrgById(orgId: string): Promise<Organization | null>;
  updateOrgSettings(orgId: string, settings: Prisma.InputJsonValue): Promise<Organization>;

  // 组织成员
  findMemberRole(orgId: string, userId: string): Promise<string | null>;

  // 系统角色配置
  findAllSystemRoleConfigs(): Promise<SystemRoleConfig[]>;

  // 用户系统角色
  findUserSystemRoles(userId: string): Promise<UserSystemRole[]>;
  hasSystemRole(userId: string, role: string): Promise<boolean>;
  upsertUserSystemRole(data: {
    id: string;
    user_id: string;
    role: string;
    granted_by: string;
    granted_at: Date;
  }): Promise<void>;
  deleteUserSystemRole(userId: string, role: string): Promise<void>;
}

/**
 * 创建 Permission Repository 实例
 */
export function createPermissionRepository(db: DbClient): PermissionRepository {
  return {
    findAll: async () => {
      return db.permission.findMany();
    },

    findByCodes: async (codes: string[]) => {
      return db.permission.findMany({ where: { code: { in: codes } } });
    },

    findOrgById: async (orgId: string) => {
      return db.organization.findUnique({ where: { id: orgId } });
    },

    updateOrgSettings: async (orgId: string, settings: Prisma.InputJsonValue) => {
      return db.organization.update({
        where: { id: orgId },
        data: { settings },
      });
    },

    findMemberRole: async (orgId: string, userId: string) => {
      const member = await db.organizationMember.findFirst({
        where: { organization_id: orgId, user_id: userId },
        select: { role: true },
      });
      return member?.role ?? null;
    },

    findAllSystemRoleConfigs: async () => {
      return db.systemRoleConfig.findMany();
    },

    findUserSystemRoles: async (userId: string) => {
      return db.userSystemRole.findMany({
        where: { user_id: userId },
      });
    },

    hasSystemRole: async (userId: string, role: string) => {
      const r = await db.userSystemRole.findFirst({
        where: { user_id: userId, role },
      });
      return !!r;
    },

    upsertUserSystemRole: async (data) => {
      await db.userSystemRole.upsert({
        where: {
          user_id_role: { user_id: data.user_id, role: data.role },
        },
        create: data,
        update: { granted_by: data.granted_by, granted_at: data.granted_at },
      });
    },

    deleteUserSystemRole: async (userId: string, role: string) => {
      await db.userSystemRole.deleteMany({
        where: { user_id: userId, role },
      });
    },
  };
}

/**
 * 默认实例
 */
export const defaultPermissionRepo = createPermissionRepository(prisma);
