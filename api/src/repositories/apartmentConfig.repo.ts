import type { Prisma, ApartmentConfig } from '@prisma/client';
import type { DbClient } from '../types/repository.types.js';

export interface ApartmentConfigRepository {
  findByApartmentId(apartmentId: string): Promise<ApartmentConfig | null>;
  findByApartmentIdWithFeeItems(apartmentId: string): Promise<ApartmentConfig & { fee_items: Array<{ id: string; category: string; name: string; amount: unknown; cycle: string; sort_order: number; is_active: boolean }> } | null>;
  upsert(apartmentId: string, data: Prisma.ApartmentConfigCreateInput): Promise<ApartmentConfig>;
  update(id: string, data: Prisma.ApartmentConfigUpdateInput): Promise<ApartmentConfig>;
  deleteByApartmentId(apartmentId: string): Promise<void>;
}

export function createApartmentConfigRepository(db: DbClient): ApartmentConfigRepository {
  return {
    findByApartmentId: async (apartmentId: string) => {
      return db.apartmentConfig.findUnique({ where: { apartment_id: apartmentId } });
    },

    findByApartmentIdWithFeeItems: async (apartmentId: string) => {
      return db.apartmentConfig.findUnique({
        where: { apartment_id: apartmentId },
        include: {
          fee_items: {
            orderBy: [{ category: 'asc' as const }, { sort_order: 'asc' as const }],
          },
        },
      });
    },

    upsert: async (apartmentId: string, data: Prisma.ApartmentConfigCreateInput) => {
      return db.apartmentConfig.upsert({
        where: { apartment_id: apartmentId },
        update: data as Prisma.ApartmentConfigUpdateInput,
        create: data,
      });
    },

    update: async (id: string, data: Prisma.ApartmentConfigUpdateInput) => {
      return db.apartmentConfig.update({ where: { id }, data });
    },

    deleteByApartmentId: async (apartmentId: string) => {
      await db.apartmentConfig.deleteMany({ where: { apartment_id: apartmentId } });
    },
  };
}

import { prisma } from '../lib/prisma.js';
export const defaultApartmentConfigRepo = createApartmentConfigRepository(prisma);
