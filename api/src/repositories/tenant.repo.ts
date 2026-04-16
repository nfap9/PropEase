import type { Prisma, Tenant } from '@prisma/client';
import type { DbClient } from '../types/repository.types.js';
import { prisma } from '../lib/prisma.js';

/**
 * Tenant Repository 接口
 */
export interface TenantRepository {
  findById(id: string): Promise<Tenant | null>;
  findByIdAndOrg(id: string, orgId: string): Promise<Tenant | null>;
  findByIds(ids: string[]): Promise<Tenant[]>;
  findByOrgId(orgId: string, search?: string): Promise<Tenant[]>;
  countByOrgId(orgId: string): Promise<number>;
  create(data: Prisma.TenantCreateInput): Promise<Tenant>;
  update(id: string, data: Prisma.TenantUpdateInput): Promise<Tenant>;
  delete(id: string): Promise<void>;
}

/**
 * 创建 Tenant Repository 实例
 * @param db - PrismaClient 或事务对象
 */
export function createTenantRepository(db: DbClient): TenantRepository {
  return {
    findById: async (id: string) => {
      return db.tenant.findUnique({ where: { id } });
    },

    findByIdAndOrg: async (id: string, orgId: string) => {
      return db.tenant.findFirst({ where: { id, organization_id: orgId } });
    },

    findByIds: async (ids: string[]) => {
      return db.tenant.findMany({ where: { id: { in: ids } } });
    },

    countByOrgId: async (orgId: string) => {
      return db.tenant.count({ where: { organization_id: orgId } });
    },

    findByOrgId: async (orgId: string, search?: string) => {
      const where: Prisma.TenantWhereInput = { organization_id: orgId };
      if (search && search.length > 0) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ];
      }
      return db.tenant.findMany({ where });
    },

    create: async (data: Prisma.TenantCreateInput) => {
      return db.tenant.create({ data });
    },

    update: async (id: string, data: Prisma.TenantUpdateInput) => {
      return db.tenant.update({ where: { id }, data });
    },

    delete: async (id: string) => {
      await db.tenant.delete({ where: { id } });
    },
  };
}

/**
 * 默认 Tenant Repository 实例（使用全局 prisma）
 */
export const defaultTenantRepo = createTenantRepository(prisma);
