import type { CustomRole, Prisma } from '../generated/client/index.js';
import type { DbClient } from '../types/repository.types.js';
import { prisma } from '../lib/prisma.js';

/**
 * CustomRole Repository 接口
 */
export interface CustomRoleRepository {
  findByOrgId(orgId: string): Promise<CustomRole[]>;
  findByIdAndOrg(id: string, orgId: string): Promise<CustomRole | null>;
  countByOrgId(orgId: string): Promise<number>;
  create(data: Prisma.CustomRoleCreateInput): Promise<CustomRole>;
  update(id: string, data: Prisma.CustomRoleUpdateInput): Promise<CustomRole>;
  delete(id: string): Promise<void>;
}

/**
 * 创建 CustomRole Repository 实例
 */
export function createCustomRoleRepository(db: DbClient): CustomRoleRepository {
  return {
    findByOrgId: async (orgId: string) => {
      return db.customRole.findMany({ where: { organization_id: orgId } });
    },

    findByIdAndOrg: async (id: string, orgId: string) => {
      return db.customRole.findFirst({
        where: { id, organization_id: orgId },
      });
    },

    countByOrgId: async (orgId: string) => {
      return db.customRole.count({ where: { organization_id: orgId } });
    },

    create: async (data: Prisma.CustomRoleCreateInput) => {
      return db.customRole.create({ data });
    },

    update: async (id: string, data: Prisma.CustomRoleUpdateInput) => {
      return db.customRole.update({ where: { id }, data });
    },

    delete: async (id: string) => {
      await db.customRole.delete({ where: { id } });
    },
  };
}

/**
 * 默认实例
 */
export const defaultCustomRoleRepo = createCustomRoleRepository(prisma);
