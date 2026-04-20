import type { Organization, OrganizationMember, OrgRole, Prisma } from '@prisma/client';
import type { DbClient } from '../types/repository.types.js';
import { prisma } from '../lib/prisma.js';

/**
 * Permission Repository 接口
 */
export interface PermissionRepository {
  // 组织
  findOrgById(orgId: string): Promise<Organization | null>;

  // 组织角色
  findOrgRoles(orgId: string): Promise<OrgRole[]>;
  findOrgRoleById(roleId: string): Promise<OrgRole | null>;
  findOrgRoleByName(orgId: string, name: string): Promise<OrgRole | null>;
  createOrgRole(data: {
    id: string;
    organization_id: string;
    name: string;
    description?: string;
    is_system: boolean;
    permissions: Prisma.InputJsonValue;
  }): Promise<OrgRole>;
  updateOrgRole(
    roleId: string,
    data: { name?: string; description?: string; permissions?: Prisma.InputJsonValue }
  ): Promise<OrgRole>;
  deleteOrgRole(roleId: string): Promise<void>;
  countRoleMembers(roleId: string): Promise<number>;

  // 组织成员
  findMemberByOrgAndUser(orgId: string, userId: string): Promise<OrganizationMember | null>;
  findMemberRoleId(orgId: string, userId: string): Promise<string | null>;
  findMemberWithRole(orgId: string, userId: string): Promise<(OrganizationMember & { role: OrgRole }) | null>;
}

/**
 * 创建 Permission Repository 实例
 */
export function createPermissionRepository(db: DbClient): PermissionRepository {
  return {
    findOrgById: async (orgId: string) => {
      return db.organization.findUnique({ where: { id: orgId } });
    },

    // 组织角色
    findOrgRoles: async (orgId: string) => {
      return db.orgRole.findMany({
        where: { organization_id: orgId },
        orderBy: [{ is_system: 'desc' }, { created_at: 'asc' }],
      });
    },

    findOrgRoleById: async (roleId: string) => {
      return db.orgRole.findUnique({ where: { id: roleId } });
    },

    findOrgRoleByName: async (orgId: string, name: string) => {
      return db.orgRole.findUnique({
        where: { organization_id_name: { organization_id: orgId, name } },
      });
    },

    createOrgRole: async (data) => {
      return db.orgRole.create({ data });
    },

    updateOrgRole: async (roleId, data) => {
      return db.orgRole.update({ where: { id: roleId }, data });
    },

    deleteOrgRole: async (roleId: string) => {
      await db.orgRole.delete({ where: { id: roleId } });
    },

    countRoleMembers: async (roleId: string) => {
      return db.organizationMember.count({ where: { role_id: roleId } });
    },

    // 组织成员
    findMemberByOrgAndUser: async (orgId: string, userId: string) => {
      return db.organizationMember.findFirst({
        where: { organization_id: orgId, user_id: userId },
      });
    },

    findMemberRoleId: async (orgId: string, userId: string) => {
      const member = await db.organizationMember.findFirst({
        where: { organization_id: orgId, user_id: userId },
        select: { role_id: true },
      });
      return member?.role_id ?? null;
    },

    findMemberWithRole: async (orgId: string, userId: string) => {
      return db.organizationMember.findFirst({
        where: { organization_id: orgId, user_id: userId },
        include: { role: true },
      });
    },
  };
}

/**
 * 默认实例
 */
export const defaultPermissionRepo = createPermissionRepository(prisma);
