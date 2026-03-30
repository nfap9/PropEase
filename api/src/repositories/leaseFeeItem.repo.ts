import type { LeaseFeeItem, Prisma, PrismaClient } from '@prisma/client';

export type LeaseFeeItemWithDetails = LeaseFeeItem & {
  feeType: { id: string; name: string; code: string };
  specification: { id: string; name: string; price_monthly: number } | null;
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
          feeType: { select: { id: true, name: true, code: true } },
          specification: { select: { id: true, name: true, price_monthly: true } },
        },
        orderBy: { created_at: 'asc' },
      });
      return results.map((r) => ({
        ...r,
        specification: r.specification
          ? { ...r.specification, price_monthly: Number(r.specification.price_monthly) }
          : null,
      })) as LeaseFeeItemWithDetails[];
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
