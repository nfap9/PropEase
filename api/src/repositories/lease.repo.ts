import type { Prisma, Lease, Room, Apartment, Tenant, LeaseFeeItem, OrgFeeItem } from '@prisma/client';
import type { DbClient } from '../types/repository.types.js';
import { prisma } from '../lib/prisma.js';

/**
 * 租约包含房间和租客信息
 */
export type LeaseWithRelations = Lease & {
  room: Room & { apartment: Apartment };
  tenant: Tenant;
  fee_items: (LeaseFeeItem & { feeType: OrgFeeItem | null })[];
};

/**
 * Lease Repository 接口
 */
export interface LeaseRepository {
  findById(id: string): Promise<Lease | null>;
  findByIdWithRelations(id: string): Promise<LeaseWithRelations | null>;
  findByOrgId(orgId: string, isActive?: boolean): Promise<LeaseWithRelations[]>;
  create(data: Prisma.LeaseCreateInput): Promise<Lease>;
  createWithRoomUpdate(leaseData: Prisma.LeaseCreateInput, roomId: string): Promise<Lease>;
  update(id: string, data: Prisma.LeaseUpdateInput): Promise<Lease>;
  terminate(id: string, roomId: string): Promise<void>;
  delete(id: string): Promise<void>;
  countOtherActive(roomId: string, excludeLeaseId: string): Promise<number>;
  countByOrgId(orgId: string): Promise<number>;
  findActiveByRoomIds(roomIds: string[]): Promise<LeaseWithRelations[]>;
}

/**
 * 创建 Lease Repository 实例
 */
export function createLeaseRepository(db: DbClient): LeaseRepository {
  const prismaClient = '$transaction' in db ? db : null;

  return {
    findById: async (id: string) => {
      return db.lease.findUnique({ where: { id } });
    },

    findByIdWithRelations: async (id: string) => {
      return db.lease.findFirst({
        where: { id },
        include: {
          room: { include: { apartment: true } },
          tenant: true,
          fee_items: { include: { feeType: true } },
        },
      }) as Promise<LeaseWithRelations | null>;
    },

    findByOrgId: async (orgId: string, isActive?: boolean) => {
      const rooms = await db.room.findMany({
        where: { apartment: { organization_id: orgId } },
        select: { id: true },
      });
      const roomIds = rooms.map((r) => r.id);

      const where: Prisma.LeaseWhereInput = { room_id: { in: roomIds } };
      if (isActive !== undefined) where.is_active = isActive;

      return db.lease.findMany({
        where,
        include: {
          room: { include: { apartment: true } },
          tenant: true,
          fee_items: { include: { feeType: true } },
        },
      }) as Promise<LeaseWithRelations[]>;
    },

    create: async (data: Prisma.LeaseCreateInput) => {
      return db.lease.create({ data });
    },

    createWithRoomUpdate: async (leaseData: Prisma.LeaseCreateInput, _roomId: string) => {
      if (!prismaClient) {
        throw new Error('Transaction not available');
      }

      const [lease] = await prismaClient.$transaction([
        db.lease.create({ data: leaseData }),
        // 不再设置 status，status 由 maintenance 和活跃租约自动计算
      ]);

      return lease;
    },

    update: async (id: string, data: Prisma.LeaseUpdateInput) => {
      return db.lease.update({ where: { id }, data });
    },

    terminate: async (id: string, _roomId: string) => {
      if (!prismaClient) {
        // 如果不在事务中，分步执行
        await db.lease.update({ where: { id }, data: { is_active: false } });
        // status 由 maintenance 和活跃租约自动计算，无需手动更新
        return;
      }

      await prismaClient.$transaction(async (tx) => {
        await tx.lease.update({ where: { id }, data: { is_active: false } });
        // status 由 maintenance 和活跃租约自动计算，无需手动更新
      });
    },

    delete: async (id: string) => {
      await db.lease.delete({ where: { id } });
    },

    countOtherActive: async (roomId: string, excludeLeaseId: string) => {
      return db.lease.count({
        where: { room_id: roomId, is_active: true, id: { not: excludeLeaseId } },
      });
    },

    countByOrgId: async (orgId: string) => {
      return db.lease.count({
        where: { room: { apartment: { organization_id: orgId } } },
      });
    },

    findActiveByRoomIds: async (roomIds: string[]) => {
      return db.lease.findMany({
        where: {
          room_id: { in: roomIds },
          is_active: true,
          // 不再通过 room.status 过滤，因为 status 现在是自动计算的
          // 只要租约 is_active=true，房间状态就会是 occupied
        },
        include: { room: { include: { apartment: true } } },
      }) as Promise<LeaseWithRelations[]>;
    },
  };
}

/**
 * 默认 Lease Repository 实例
 */
export const defaultLeaseRepo = createLeaseRepository(prisma);
