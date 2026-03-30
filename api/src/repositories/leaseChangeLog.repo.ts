import type { LeaseChangeLog, Prisma, PrismaClient } from '@prisma/client';

export interface LeaseChangeLogRepository {
  findByLeaseId(leaseId: string): Promise<LeaseChangeLog[]>;
  create(data: Prisma.LeaseChangeLogCreateInput): Promise<LeaseChangeLog>;
  findPendingChanges(year: number, month: number): Promise<LeaseChangeLog[]>;
}

export function createLeaseChangeLogRepository(
  prisma: PrismaClient | Prisma.TransactionClient
): LeaseChangeLogRepository {
  return {
    findByLeaseId: async (leaseId: string) => {
      return prisma.leaseChangeLog.findMany({
        where: { lease_id: leaseId },
        orderBy: { created_at: 'desc' },
      });
    },

    create: async (data: Prisma.LeaseChangeLogCreateInput) => {
      return prisma.leaseChangeLog.create({ data });
    },

    findPendingChanges: async (year: number, month: number) => {
      return prisma.leaseChangeLog.findMany({
        where: {
          effective_from_year: year,
          effective_from_month: month,
        },
        orderBy: [{ lease_id: 'asc' }, { created_at: 'asc' }],
      });
    },
  };
}
