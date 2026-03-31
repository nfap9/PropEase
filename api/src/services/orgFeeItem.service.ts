import { ulid } from 'ulid';
import { prisma } from '../lib/prisma.js';
import { createAppError } from '../utils/appError.js';

/**
 * 组织级费用项目
 */
export interface OrgFeeItem {
  id: string;
  organization_id: string;
  category: string;
  name: string;
  amount: unknown;
  cycle: string;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateOrgFeeItemInput {
  name: string;
  category: string;
  amount: number;
  cycle: string;
}

export interface UpdateOrgFeeItemInput {
  name?: string;
  category?: string;
  amount?: number;
  cycle?: string;
  is_active?: boolean;
  sort_order?: number;
}

export type OrgFeeItemWithDefaults = OrgFeeItem;

export interface OrgFeeItemService {
  list(orgId: string, filters?: { category?: string; cycle?: string; search?: string }): Promise<OrgFeeItemWithDefaults[]>;
  getById(orgId: string, id: string): Promise<OrgFeeItemWithDefaults>;
  create(orgId: string, data: CreateOrgFeeItemInput): Promise<OrgFeeItemWithDefaults>;
  update(orgId: string, id: string, data: UpdateOrgFeeItemInput): Promise<OrgFeeItem>;
  delete(orgId: string, id: string): Promise<void>;
}

async function validateOwnership(orgId: string, id: string): Promise<OrgFeeItem> {
  const item = await prisma.orgFeeItem.findFirst({
    where: { id, organization_id: orgId },
  });
  if (!item) {
    throw createAppError(404, '费用项目不存在');
  }
  return item;
}

export function createOrgFeeItemService(): OrgFeeItemService {
  return {
    list: async (orgId: string, filters) => {
      const where: any = {
        organization_id: orgId,
        is_active: true,
      };
      if (filters?.category) {
        where.category = filters.category;
      }
      if (filters?.cycle) {
        where.cycle = filters.cycle;
      }
      if (filters?.search) {
        where.name = { contains: filters.search, mode: 'insensitive' };
      }
      return prisma.orgFeeItem.findMany({
        where,
        orderBy: [{ category: 'asc' }, { sort_order: 'asc' }],
      });
    },

    getById: async (orgId: string, id: string) => {
      const item = await prisma.orgFeeItem.findFirst({
        where: { id, organization_id: orgId, is_active: true },
      });
      if (!item) {
        throw createAppError(404, '费用项目不存在');
      }
      return item;
    },

    create: async (orgId: string, data: CreateOrgFeeItemInput) => {
      const existing = await prisma.orgFeeItem.findFirst({
        where: { organization_id: orgId, name: data.name },
      });
      if (existing) {
        throw createAppError(400, '费用项目名称已存在');
      }
      return prisma.orgFeeItem.create({
        data: {
          id: ulid().toLowerCase(),
          organization_id: orgId,
          name: data.name,
          category: data.category,
          amount: data.amount,
          cycle: data.cycle,
          sort_order: 0,
          is_active: true,
        },
      });
    },

    update: async (orgId: string, id: string, data: UpdateOrgFeeItemInput) => {
      await validateOwnership(orgId, id);
      return prisma.orgFeeItem.update({
        where: { id },
        data: {
          name: data.name,
          category: data.category,
          amount: data.amount,
          cycle: data.cycle,
          is_active: data.is_active,
          sort_order: data.sort_order,
        },
      });
    },

    delete: async (orgId: string, id: string) => {
      await validateOwnership(orgId, id);
      await prisma.orgFeeItem.update({
        where: { id },
        data: { is_active: false },
      });
    },
  };
}

export const defaultOrgFeeItemService = createOrgFeeItemService();
