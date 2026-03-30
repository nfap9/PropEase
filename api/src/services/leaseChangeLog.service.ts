import type { LeaseChangeLog, Prisma } from '@prisma/client';
import { ulid } from 'ulid';
import { prisma } from '../lib/prisma.js';
import {
  createLeaseChangeLogRepository,
  type LeaseChangeLogRepository,
} from '../repositories/leaseChangeLog.repo.js';

export interface CreateChangeLogInput {
  lease_id: string;
  change_type: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  effective_from_year?: number;
  effective_from_month?: number;
  reason?: string;
  created_by?: string;
}

export interface LeaseChangeLogService {
  list(leaseId: string): Promise<LeaseChangeLog[]>;
  create(data: CreateChangeLogInput): Promise<LeaseChangeLog>;
}

export function createLeaseChangeLogService(
  getRepo: () => LeaseChangeLogRepository = () => createLeaseChangeLogRepository(prisma)
): LeaseChangeLogService {
  return {
    list: async (leaseId: string) => {
      return getRepo().findByLeaseId(leaseId);
    },

    create: async (data: CreateChangeLogInput) => {
      return getRepo().create({
        id: ulid().toLowerCase(),
        lease: { connect: { id: data.lease_id } },
        change_type: data.change_type,
        old_value: (data.old_value ?? undefined) as Prisma.InputJsonValue,
        new_value: (data.new_value ?? undefined) as Prisma.InputJsonValue,
        effective_from_year: data.effective_from_year ?? null,
        effective_from_month: data.effective_from_month ?? null,
        reason: data.reason ?? null,
        created_by: data.created_by ?? null,
      });
    },
  };
}

export const defaultLeaseChangeLogService = createLeaseChangeLogService();
