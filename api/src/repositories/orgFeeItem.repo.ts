import type { Prisma, OrgFeeItem } from '@prisma/client';
import type { DbClient } from '../types/repository.types.js';

/**
 * OrgFeeItem Repository 接口
 */
export interface OrgFeeItemRepository {
  findById(id: string): Promise<OrgFeeItem | null>;
  findByIdAndOrg(id: string, orgId: string): Promise<OrgFeeItem | null>;
  findByOrgId(
    orgId: string,
    filters?: { category?: string; cycle?: string; search?: string; isActive?: boolean }
  ): Promise<OrgFeeItem[]>;
  findByIds(ids: string[]): Promise<OrgFeeItem[]>;
  create(data: Prisma.OrgFeeItemCreateInput): Promise<OrgFeeItem>;
  update(id: string, data: Prisma.OrgFeeItemUpdateInput): Promise<OrgFeeItem>;
  softDelete(id: string): Promise<void>;
}

/**
 * 创建 OrgFeeItem Repository 实例
 */
export function createOrgFeeItemRepository(db: DbClient): OrgFeeItemRepository {
  return {
    findById: async (id: string) => {
      return db.orgFeeItem.findUnique({ where: { id } });
    },

    findByIdAndOrg: async (id: string, orgId: string) => {
      return db.orgFeeItem.findFirst({ where: { id, organization_id: orgId } });
    },

    findByOrgId: async (orgId: string, filters) => {
      const where: Prisma.OrgFeeItemWhereInput = {
        organization_id: orgId,
      };
      if (filters?.isActive !== undefined) {
        where.is_active = filters.isActive;
      }
      if (filters?.category) {
        where.category = filters.category;
      }
      if (filters?.cycle) {
        where.cycle = filters.cycle;
      }
      if (filters?.search) {
        where.name = { contains: filters.search, mode: 'insensitive' };
      }
      return db.orgFeeItem.findMany({
        where,
        orderBy: [{ category: 'asc' }, { sort_order: 'asc' }],
      });
    },

    findByIds: async (ids: string[]) => {
      return db.orgFeeItem.findMany({ where: { id: { in: ids } } });
    },

    create: async (data: Prisma.OrgFeeItemCreateInput) => {
      return db.orgFeeItem.create({ data });
    },

    update: async (id: string, data: Prisma.OrgFeeItemUpdateInput) => {
      return db.orgFeeItem.update({ where: { id }, data });
    },

    softDelete: async (id: string) => {
      await db.orgFeeItem.update({ where: { id }, data: { is_active: false } });
    },
  };
}

/**
 * 默认实例
 */
import { prisma } from '../lib/prisma.js';
export const defaultOrgFeeItemRepo = createOrgFeeItemRepository(prisma);
