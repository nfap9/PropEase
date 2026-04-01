import type { Prisma, PrismaClient } from '@prisma/client';

/**
 * 租约费用项目（包含冗余的費用項目信息）
 */
export type LeaseFeeItemWithDetails = {
  id: string;
  lease_id: string;
  fee_type_id: string;
  fee_category: string;
  fee_name: string;
  fee_amount: unknown;
  fee_cycle: string;
  quantity: unknown;
  created_at: Date;
  updated_at: Date;
  feeType: { id: string; name: string; category: string; amount: unknown; cycle: string };
};

export interface LeaseFeeItemRepository {
  findByLeaseId(leaseId: string): Promise<LeaseFeeItemWithDetails[]>;
  createMany(data: Prisma.LeaseFeeItemCreateManyInput[]): Promise<number>;
  deleteByLeaseId(leaseId: string): Promise<number>;
}

export function createLeaseFeeItemRepository(
  prisma: PrismaClient | Prisma.TransactionClient
): LeaseFeeItemRepository {
  return {
    findByLeaseId: async (leaseId: string) => {
      const results = await prisma.leaseFeeItem.findMany({
        where: { lease_id: leaseId },
        include: {
          feeType: { select: { id: true, name: true, category: true, amount: true, cycle: true } },
        },
        orderBy: { created_at: 'asc' },
      });
      return results as LeaseFeeItemWithDetails[];
    },

    createMany: async (data: Prisma.LeaseFeeItemCreateManyInput[]) => {
      const result = await prisma.leaseFeeItem.createMany({ data });
      return result.count;
    },

    deleteByLeaseId: async (leaseId: string) => {
      const result = await prisma.leaseFeeItem.deleteMany({ where: { lease_id: leaseId } });
      return result.count;
    },
  };
}
