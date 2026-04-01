import type { PlatformConfig } from '@prisma/client';
import type { DbClient } from '../types/repository.types.js';

export interface PlatformConfigRepository {
  findDefault(): Promise<PlatformConfig | null>;
}

export function createPlatformConfigRepository(db: DbClient): PlatformConfigRepository {
  return {
    findDefault: async () => {
      return db.platformConfig.findUnique({ where: { id: 'default' } });
    },
  };
}

import { prisma } from '../lib/prisma.js';
export const defaultPlatformConfigRepo = createPlatformConfigRepository(prisma);
