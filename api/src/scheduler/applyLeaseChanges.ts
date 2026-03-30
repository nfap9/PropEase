import { prisma } from '../lib/prisma.js';
import { createLeaseChangeLogRepository } from '../repositories/leaseChangeLog.repo.js';
import { logger } from '../utils/logger.js';

export interface ApplyLeaseChangesResult {
  processedCount: number;
  appliedChanges: Array<{
    lease_id: string;
    change_type: string;
    field: string;
    old_value: unknown;
    new_value: unknown;
  }>;
}

export async function applyLeaseChanges(): Promise<ApplyLeaseChangesResult> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const repo = createLeaseChangeLogRepository(prisma);
  const pendingChanges = await repo.findPendingChanges(year, month);

  const appliedChanges: ApplyLeaseChangesResult['appliedChanges'] = [];
  let processedCount = 0;

  for (const change of pendingChanges) {
    const newValue = change.new_value as Record<string, unknown>;
    if (!newValue) continue;

    try {
      await prisma.$transaction(async (tx) => {
        const updateData: Record<string, unknown> = {};

        switch (change.change_type) {
          case 'rent_change':
            if (newValue.monthly_rent !== undefined) {
              updateData.monthly_rent = newValue.monthly_rent;
            }
            break;
          case 'utility_rate_change':
            if (newValue.water_rate !== undefined) {
              updateData.water_rate = newValue.water_rate;
            }
            if (newValue.electricity_rate !== undefined) {
              updateData.electricity_rate = newValue.electricity_rate;
            }
            break;
          case 'deposit_change':
            if (newValue.deposit !== undefined) {
              updateData.deposit = newValue.deposit;
            }
            break;
          default:
            break;
        }

        if (Object.keys(updateData).length > 0) {
          await tx.lease.update({
            where: { id: change.lease_id },
            data: updateData as Parameters<typeof tx.lease.update>[0]['data'],
          });
        }

        appliedChanges.push({
          lease_id: change.lease_id,
          change_type: change.change_type,
          field: Object.keys(updateData)[0] ?? '',
          old_value: change.old_value,
          new_value: change.new_value,
        });
        processedCount++;
      });
    } catch (e) {
      logger.error({ err: e, change }, 'Failed to apply lease change');
    }
  }

  return { processedCount, appliedChanges };
}
