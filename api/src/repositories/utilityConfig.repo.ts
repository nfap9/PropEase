import type { UtilityConfig } from '@prisma/client';
import type { DbClient } from '../types/repository.types.js';

export interface UtilityConfigRepository {
  findByApartmentId(apartmentId: string): Promise<UtilityConfig | null>;
}

export function createUtilityConfigRepository(db: DbClient): UtilityConfigRepository {
  return {
    findByApartmentId: async (apartmentId: string) => {
      return db.utilityConfig.findUnique({ where: { apartment_id: apartmentId } });
    },
  };
}

import { prisma } from '../lib/prisma.js';
export const defaultUtilityConfigRepo = createUtilityConfigRepository(prisma);
