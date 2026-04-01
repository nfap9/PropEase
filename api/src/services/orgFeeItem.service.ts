import { ulid } from 'ulid';
import { createOrgFeeItemRepository, type OrgFeeItemRepository } from '../repositories/orgFeeItem.repo.js';
import { createAppError } from '../utils/appError.js';
import { prisma } from '../lib/prisma.js';

/**
 * 组织级费用项目（本地定义，避免 Prisma 7.x Decimal 类型解析问题）
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

/**
 * 创建 OrgFeeItem Service 实例
 */
export function createOrgFeeItemService(
  getRepo: () => OrgFeeItemRepository = () => createOrgFeeItemRepository(prisma)
): OrgFeeItemService {
  return {
    list: async (orgId: string, filters) => {
      return getRepo().findByOrgId(orgId, { ...filters, isActive: true });
    },

    getById: async (orgId: string, id: string) => {
      const item = await getRepo().findByIdAndOrg(id, orgId);
      if (!item || !item.is_active) {
        throw createAppError(404, '费用项目不存在');
      }
      return item;
    },

    create: async (orgId: string, data: CreateOrgFeeItemInput) => {
      const existing = await getRepo().findByOrgId(orgId);
      const hasDuplicate = existing.some(
        (item) => item.is_active && item.name === data.name
      );
      if (hasDuplicate) {
        throw createAppError(400, '费用项目名称已存在');
      }
      return getRepo().create({
        id: ulid().toLowerCase(),
        organization_id: orgId,
        name: data.name,
        category: data.category,
        amount: data.amount,
        cycle: data.cycle,
        sort_order: 0,
        is_active: true,
      });
    },

    update: async (orgId: string, id: string, data: UpdateOrgFeeItemInput) => {
      const existing = await getRepo().findByIdAndOrg(id, orgId);
      if (!existing) {
        throw createAppError(404, '费用项目不存在');
      }
      return getRepo().update(id, {
        name: data.name,
        category: data.category,
        amount: data.amount,
        cycle: data.cycle,
        is_active: data.is_active,
        sort_order: data.sort_order,
      });
    },

    delete: async (orgId: string, id: string) => {
      const existing = await getRepo().findByIdAndOrg(id, orgId);
      if (!existing) {
        throw createAppError(404, '费用项目不存在');
      }
      await getRepo().softDelete(id);
    },
  };
}

export const defaultOrgFeeItemService = createOrgFeeItemService();
