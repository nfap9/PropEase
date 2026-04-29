import { ulid } from 'ulid';
import type { ApartmentFeeItem } from '@prisma/client';
import type { ApartmentFeeItemRepository } from '../repositories/apartmentFeeItem.repo.js';
import { createApartmentFeeItemRepository } from '../repositories/apartmentFeeItem.repo.js';
import { createApartmentConfigRepository } from '../repositories/apartmentConfig.repo.js';
import { prisma } from '../lib/prisma.js';
import { createAppError } from '../utils/appError.js';
import { NotFoundMessages } from '../messages.js';

export interface CreateApartmentFeeItemInput {
  name: string;
  category: string;
  amount: number;
  cycle: string;
}

export interface UpdateApartmentFeeItemInput {
  name?: string;
  category?: string;
  amount?: number;
  cycle?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface ApartmentFeeItemService {
  list(apartmentId: string, filters?: { category?: string; cycle?: string; search?: string }): Promise<ApartmentFeeItem[]>;
  getById(apartmentId: string, id: string): Promise<ApartmentFeeItem>;
  create(apartmentId: string, data: CreateApartmentFeeItemInput): Promise<ApartmentFeeItem>;
  update(apartmentId: string, id: string, data: UpdateApartmentFeeItemInput): Promise<ApartmentFeeItem>;
  delete(apartmentId: string, id: string): Promise<void>;
}

export function createApartmentFeeItemService(
  getRepo: () => ApartmentFeeItemRepository = () => createApartmentFeeItemRepository(prisma),
  getConfigRepo: () => ReturnType<typeof createApartmentConfigRepository> = () => createApartmentConfigRepository(prisma)
): ApartmentFeeItemService {
  return {
    list: async (apartmentId: string, filters) => {
      return getRepo().findByApartmentId(apartmentId, { ...filters, isActive: true });
    },

    getById: async (apartmentId: string, id: string) => {
      const item = await getRepo().findByIdAndApartment(id, apartmentId);
      if (!item || !item.is_active) {
        throw createAppError(404, '费用项目不存在');
      }
      return item;
    },

    create: async (apartmentId: string, data: CreateApartmentFeeItemInput) => {
      // 确保公寓配置存在
      const config = await getConfigRepo().findByApartmentId(apartmentId);
      if (!config) {
        throw createAppError(404, NotFoundMessages.APARTMENT_CONFIG);
      }

      const existing = await getRepo().findByApartmentId(apartmentId);
      const hasDuplicate = existing.some(
        (item) => item.is_active && item.name === data.name
      );
      if (hasDuplicate) {
        throw createAppError(400, '费用项目名称已存在');
      }

      return getRepo().create({
        id: ulid().toLowerCase(),
        apartment: { connect: { id: apartmentId } },
        name: data.name,
        category: data.category,
        amount: data.amount,
        cycle: data.cycle,
        sort_order: 0,
        is_active: true,
      });
    },

    update: async (apartmentId: string, id: string, data: UpdateApartmentFeeItemInput) => {
      const existing = await getRepo().findByIdAndApartment(id, apartmentId);
      if (!existing) {
        throw createAppError(404, '费用项目不存在');
      }

      // 如果改名，检查是否与其他项目冲突
      if (data.name && data.name !== existing.name) {
        const siblings = await getRepo().findByApartmentId(apartmentId);
        const hasConflict = siblings.some(
          (item) => item.id !== id && item.is_active && item.name === data.name
        );
        if (hasConflict) {
          throw createAppError(400, '费用项目名称已存在');
        }
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

    delete: async (apartmentId: string, id: string) => {
      const existing = await getRepo().findByIdAndApartment(id, apartmentId);
      if (!existing) {
        throw createAppError(404, '费用项目不存在');
      }
      await getRepo().softDelete(id);
    },
  };
}

export const defaultApartmentFeeItemService = createApartmentFeeItemService();
