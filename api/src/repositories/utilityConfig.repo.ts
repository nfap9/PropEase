import type { Prisma, UtilityConfig } from '@prisma/client';
import type { DbClient } from '../types/repository.types.js';

export interface UtilityConfigRepository {
  findByApartmentId(apartmentId: string): Promise<UtilityConfig | null>;
  upsert(apartmentId: string, data: Prisma.UtilityConfigCreateInput): Promise<UtilityConfig>;
  update(id: string, data: Prisma.UtilityConfigUpdateInput): Promise<UtilityConfig>;
  deleteByApartmentId(apartmentId: string): Promise<void>;
}

export function createUtilityConfigRepository(db: DbClient): UtilityConfigRepository {
  return {
    findByApartmentId: async (apartmentId: string) => {
      return db.utilityConfig.findUnique({ where: { apartment_id: apartmentId } });
    },

    upsert: async (apartmentId: string, data: Prisma.UtilityConfigCreateInput) => {
      return db.utilityConfig.upsert({
        where: { apartment_id: apartmentId },
        update: data as Prisma.UtilityConfigUpdateInput,
        create: data,
      });
    },

    update: async (id: string, data: Prisma.UtilityConfigUpdateInput) => {
      return db.utilityConfig.update({ where: { id }, data });
    },

    deleteByApartmentId: async (apartmentId: string) => {
      await db.utilityConfig.deleteMany({ where: { apartment_id: apartmentId } });
    },
  };
}

import { prisma } from '../lib/prisma.js';
export const defaultUtilityConfigRepo = createUtilityConfigRepository(prisma);
