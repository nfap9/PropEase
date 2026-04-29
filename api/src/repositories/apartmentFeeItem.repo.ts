import type { Prisma, ApartmentFeeItem } from '@prisma/client';
import type { DbClient } from '../types/repository.types.js';

export interface ApartmentFeeItemRepository {
  findById(id: string): Promise<ApartmentFeeItem | null>;
  findByIdAndApartment(id: string, apartmentId: string): Promise<ApartmentFeeItem | null>;
  findByApartmentId(
    apartmentId: string,
    filters?: { category?: string; cycle?: string; search?: string; isActive?: boolean }
  ): Promise<ApartmentFeeItem[]>;
  findByIds(ids: string[]): Promise<ApartmentFeeItem[]>;
  create(data: Prisma.ApartmentFeeItemCreateInput): Promise<ApartmentFeeItem>;
  createMany(data: Prisma.ApartmentFeeItemCreateManyInput[]): Promise<Prisma.BatchPayload>;
  update(id: string, data: Prisma.ApartmentFeeItemUpdateInput): Promise<ApartmentFeeItem>;
  softDelete(id: string): Promise<void>;
  deleteByApartmentId(apartmentId: string): Promise<void>;
}

export function createApartmentFeeItemRepository(db: DbClient): ApartmentFeeItemRepository {
  return {
    findById: async (id: string) => {
      return db.apartmentFeeItem.findUnique({ where: { id } });
    },

    findByIdAndApartment: async (id: string, apartmentId: string) => {
      return db.apartmentFeeItem.findFirst({ where: { id, apartment_id: apartmentId } });
    },

    findByApartmentId: async (apartmentId: string, filters) => {
      const where: Prisma.ApartmentFeeItemWhereInput = {
        apartment_id: apartmentId,
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
      return db.apartmentFeeItem.findMany({
        where,
        orderBy: [{ category: 'asc' as const }, { sort_order: 'asc' as const }],
      });
    },

    findByIds: async (ids: string[]) => {
      return db.apartmentFeeItem.findMany({ where: { id: { in: ids } } });
    },

    create: async (data: Prisma.ApartmentFeeItemCreateInput) => {
      return db.apartmentFeeItem.create({ data });
    },

    createMany: async (data: Prisma.ApartmentFeeItemCreateManyInput[]) => {
      return db.apartmentFeeItem.createMany({ data });
    },

    update: async (id: string, data: Prisma.ApartmentFeeItemUpdateInput) => {
      return db.apartmentFeeItem.update({ where: { id }, data });
    },

    softDelete: async (id: string) => {
      await db.apartmentFeeItem.update({ where: { id }, data: { is_active: false } });
    },

    deleteByApartmentId: async (apartmentId: string) => {
      await db.apartmentFeeItem.deleteMany({ where: { apartment_id: apartmentId } });
    },
  };
}

import { prisma } from '../lib/prisma.js';
export const defaultApartmentFeeItemRepo = createApartmentFeeItemRepository(prisma);
