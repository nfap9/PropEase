import { ulid } from 'ulid';
import type { Prisma, UtilityConfig } from '@prisma/client';
import type { UtilityConfigRepository } from '../repositories/utilityConfig.repo.js';
import { createUtilityConfigRepository } from '../repositories/utilityConfig.repo.js';
import { prisma } from '../lib/prisma.js';
import { createAppError } from '../utils/appError.js';
import { NotFoundMessages } from '../messages.js';

export interface UtilityConfigInput {
  water_price_per_unit?: number;
  electricity_price_per_unit?: number;
  internet_fee?: number;
  management_fee?: number;
  service_fee?: number;
  notes?: string;
}

export interface UtilityConfigService {
  getByApartmentId(apartmentId: string): Promise<UtilityConfig | null>;
  upsert(apartmentId: string, data: UtilityConfigInput): Promise<UtilityConfig>;
  update(apartmentId: string, data: UtilityConfigInput): Promise<UtilityConfig>;
  delete(apartmentId: string): Promise<void>;
}

function buildCreateData(apartmentId: string, data: UtilityConfigInput): Prisma.UtilityConfigCreateInput {
  return {
    id: ulid().toLowerCase(),
    apartment: { connect: { id: apartmentId } },
    water_price_per_unit: data.water_price_per_unit,
    electricity_price_per_unit: data.electricity_price_per_unit,
    internet_fee: data.internet_fee,
    management_fee: data.management_fee,
    service_fee: data.service_fee,
    notes: data.notes,
  };
}

function buildUpdateData(data: UtilityConfigInput): Prisma.UtilityConfigUpdateInput {
  return {
    water_price_per_unit: data.water_price_per_unit,
    electricity_price_per_unit: data.electricity_price_per_unit,
    internet_fee: data.internet_fee,
    management_fee: data.management_fee,
    service_fee: data.service_fee,
    notes: data.notes,
  };
}

export function createUtilityConfigService(
  getRepo: () => UtilityConfigRepository = () => createUtilityConfigRepository(prisma)
): UtilityConfigService {
  return {
    getByApartmentId: async (apartmentId: string) => {
      return getRepo().findByApartmentId(apartmentId);
    },

    upsert: async (apartmentId: string, data: UtilityConfigInput) => {
      return getRepo().upsert(apartmentId, buildCreateData(apartmentId, data));
    },

    update: async (apartmentId: string, data: UtilityConfigInput) => {
      const existing = await getRepo().findByApartmentId(apartmentId);
      if (!existing) {
        throw createAppError(404, NotFoundMessages.UTILITY_CONFIG);
      }
      return getRepo().update(existing.id, buildUpdateData(data));
    },

    delete: async (apartmentId: string) => {
      const existing = await getRepo().findByApartmentId(apartmentId);
      if (!existing) {
        throw createAppError(404, NotFoundMessages.UTILITY_CONFIG);
      }
      await getRepo().deleteByApartmentId(apartmentId);
    },
  };
}

export const defaultUtilityConfigService = createUtilityConfigService();
