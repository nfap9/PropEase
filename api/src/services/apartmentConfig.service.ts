import { ulid } from 'ulid';
import type { Prisma, ApartmentConfig } from '@prisma/client';
import type { ApartmentConfigRepository } from '../repositories/apartmentConfig.repo.js';

import { createApartmentConfigRepository } from '../repositories/apartmentConfig.repo.js';
import { createApartmentFeeItemRepository } from '../repositories/apartmentFeeItem.repo.js';
import { prisma } from '../lib/prisma.js';
import { createAppError } from '../utils/appError.js';
import { NotFoundMessages } from '../messages.js';

export interface ApartmentConfigInput {
  water_price_per_unit?: number;
  electricity_price_per_unit?: number;
}

export interface CopyConfigInput {
  target_apartment_ids: string[];
  mode: 'overwrite' | 'merge';
  include_utility_prices: boolean;
  include_fee_items: boolean;
}

export interface CopyConfigResult {
  applied: string[];
  skipped: string[];
  details: Record<string, { fee_items_created: number; fee_items_updated: number; fee_items_unchanged: number }>;
}

export interface ApartmentConfigService {
  getByApartmentId(apartmentId: string): Promise<ApartmentConfig | null>;
  getWithFeeItems(apartmentId: string): Promise<(ApartmentConfig & { fee_items: Array<{ id: string; category: string; name: string; amount: unknown; cycle: string; sort_order: number; is_active: boolean }> }) | null>;
  upsert(apartmentId: string, data: ApartmentConfigInput): Promise<ApartmentConfig>;
  update(apartmentId: string, data: ApartmentConfigInput): Promise<ApartmentConfig>;
  delete(apartmentId: string): Promise<void>;
  copyConfig(sourceApartmentId: string, input: CopyConfigInput): Promise<CopyConfigResult>;
}

function buildCreateData(apartmentId: string, data: ApartmentConfigInput): Prisma.ApartmentConfigCreateInput {
  return {
    id: ulid().toLowerCase(),
    apartment: { connect: { id: apartmentId } },
    water_price_per_unit: data.water_price_per_unit,
    electricity_price_per_unit: data.electricity_price_per_unit,
  };
}

function buildUpdateData(data: ApartmentConfigInput): Prisma.ApartmentConfigUpdateInput {
  return {
    water_price_per_unit: data.water_price_per_unit,
    electricity_price_per_unit: data.electricity_price_per_unit,
  };
}

export function createApartmentConfigService(
  getConfigRepo: () => ApartmentConfigRepository = () => createApartmentConfigRepository(prisma)
): ApartmentConfigService {
  return {
    getByApartmentId: async (apartmentId: string) => {
      return getConfigRepo().findByApartmentId(apartmentId);
    },

    getWithFeeItems: async (apartmentId: string) => {
      return getConfigRepo().findByApartmentIdWithFeeItems(apartmentId);
    },

    upsert: async (apartmentId: string, data: ApartmentConfigInput) => {
      return getConfigRepo().upsert(apartmentId, buildCreateData(apartmentId, data));
    },

    update: async (apartmentId: string, data: ApartmentConfigInput) => {
      const existing = await getConfigRepo().findByApartmentId(apartmentId);
      if (!existing) {
        throw createAppError(404, NotFoundMessages.APARTMENT_CONFIG);
      }
      return getConfigRepo().update(existing.id, buildUpdateData(data));
    },

    delete: async (apartmentId: string) => {
      const existing = await getConfigRepo().findByApartmentId(apartmentId);
      if (!existing) {
        throw createAppError(404, NotFoundMessages.APARTMENT_CONFIG);
      }
      await getConfigRepo().deleteByApartmentId(apartmentId);
    },

    copyConfig: async (sourceApartmentId: string, input: CopyConfigInput): Promise<CopyConfigResult> => {
      const configRepo = getConfigRepo();

      const sourceConfig = await configRepo.findByApartmentIdWithFeeItems(sourceApartmentId);
      if (!sourceConfig) {
        throw createAppError(404, NotFoundMessages.APARTMENT_CONFIG);
      }

      const result: CopyConfigResult = {
        applied: [],
        skipped: [],
        details: {},
      };

      for (const targetId of input.target_apartment_ids) {
        if (targetId === sourceApartmentId) {
          result.skipped.push(targetId);
          continue;
        }

        try {
          await prisma.$transaction(async (tx) => {
            const txConfigRepo = createApartmentConfigRepository(tx);
            const txFeeItemRepo = createApartmentFeeItemRepository(tx);

            // 复制水电单价
            if (input.include_utility_prices) {
              await txConfigRepo.upsert(targetId, {
                id: ulid().toLowerCase(),
                apartment: { connect: { id: targetId } },
                water_price_per_unit: sourceConfig.water_price_per_unit,
                electricity_price_per_unit: sourceConfig.electricity_price_per_unit,
              });
            }

            // 复制费用项目
            if (input.include_fee_items) {
              if (input.mode === 'overwrite') {
                // 覆盖模式：删除目标公寓所有费用项目，重新创建
                await txFeeItemRepo.deleteByApartmentId(targetId);

                if (sourceConfig.fee_items.length > 0) {
                  await txFeeItemRepo.createMany(
                    sourceConfig.fee_items.map((item) => ({
                      id: ulid().toLowerCase(),
                      apartment_id: targetId,
                      category: item.category,
                      name: item.name,
                      amount: Number(item.amount),
                      cycle: item.cycle,
                      sort_order: item.sort_order,
                      is_active: item.is_active,
                    }))
                  );
                }

                result.details[targetId] = {
                  fee_items_created: sourceConfig.fee_items.length,
                  fee_items_updated: 0,
                  fee_items_unchanged: 0,
                };
              } else {
                // 合并模式：同名覆盖，新增保留，目标独有的保留
                const targetFeeItems = await txFeeItemRepo.findByApartmentId(targetId);
                const targetMap = new Map(targetFeeItems.map((i) => [i.name, i]));
                const sourceMap = new Map(sourceConfig.fee_items.map((i) => [i.name, i]));

                let created = 0;
                let updated = 0;
                let unchanged = 0;

                // 处理源公寓的费用项目（同名覆盖或新增）
                for (const [name, sourceItem] of sourceMap) {
                  const targetItem = targetMap.get(name);
                  if (targetItem) {
                    // 同名覆盖
                    await txFeeItemRepo.update(targetItem.id, {
                      category: sourceItem.category,
                      amount: Number(sourceItem.amount),
                      cycle: sourceItem.cycle,
                      sort_order: sourceItem.sort_order,
                      is_active: sourceItem.is_active,
                    });
                    updated++;
                  } else {
                    // 新增
                    await txFeeItemRepo.create({
                      id: ulid().toLowerCase(),
                      apartment: { connect: { id: targetId } },
                      category: sourceItem.category,
                      name: sourceItem.name,
                      amount: Number(sourceItem.amount),
                      cycle: sourceItem.cycle,
                      sort_order: sourceItem.sort_order,
                      is_active: sourceItem.is_active,
                    });
                    created++;
                  }
                }

                // 目标公寓独有的保留（无需操作）
                for (const [name] of targetMap) {
                  if (!sourceMap.has(name)) {
                    unchanged++;
                  }
                }

                result.details[targetId] = {
                  fee_items_created: created,
                  fee_items_updated: updated,
                  fee_items_unchanged: unchanged,
                };
              }
            }
          });

          result.applied.push(targetId);
        } catch (error) {
          result.skipped.push(targetId);
          // 继续处理下一个目标公寓
        }
      }

      return result;
    },
  };
}

export const defaultApartmentConfigService = createApartmentConfigService();
