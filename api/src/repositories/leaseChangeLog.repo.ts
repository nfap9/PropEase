import type { LeaseChangeLog, Prisma } from '@prisma/client';
import type { DbClient } from '../types/repository.types.js';

export interface LeaseChangeLogRepository {
  findByLeaseId(leaseId: string): Promise<LeaseChangeLog[]>;
  create(data: Prisma.LeaseChangeLogCreateInput): Promise<LeaseChangeLog>;
  findPendingChanges(year: number, month: number): Promise<LeaseChangeLog[]>;
}

export function createLeaseChangeLogRepository(
  db: DbClient
): LeaseChangeLogRepository {
  return {
    findByLeaseId: async (leaseId: string) => {
      return db.leaseChangeLog.findMany({
        where: { lease_id: leaseId },
        orderBy: { created_at: 'desc' },
      });
    },

    create: async (data: Prisma.LeaseChangeLogCreateInput) => {
      return db.leaseChangeLog.create({ data });
    },

    findPendingChanges: async (year: number, month: number) => {
      return db.leaseChangeLog.findMany({
        where: {
          effective_from_year: year,
          effective_from_month: month,
        },
        orderBy: [{ lease_id: 'asc' }, { created_at: 'asc' }],
      });
    },
  };
}
