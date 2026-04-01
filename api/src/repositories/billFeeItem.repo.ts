import type { BillFeeItem } from '@prisma/client';
import type { DbClient } from '../types/repository.types.js';

export interface BillFeeItemRepository {
  findByBillId(billId: string): Promise<BillFeeItem[]>;
}

export function createBillFeeItemRepository(db: DbClient): BillFeeItemRepository {
  return {
    findByBillId: async (billId: string) => {
      return db.billFeeItem.findMany({
        where: { bill_id: billId },
        orderBy: { created_at: 'asc' },
      });
    },
  };
}

import { prisma } from '../lib/prisma.js';
export const defaultBillFeeItemRepo = createBillFeeItemRepository(prisma);
