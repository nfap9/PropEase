import type { Prisma, Lease, Room, Apartment, Tenant, LeaseFeeItem, FeeType, FeeSpecification } from '@prisma/client';
import type { DbClient } from '../types/repository.types.js';
import { prisma } from '../lib/prisma.js';

/**
 * 租约包含房间和租客信息
 */
export type LeaseWithRelations = Lease & {
  room: Room & { apartment: Apartment };
  tenant: Tenant;
  fee_items: (LeaseFeeItem & { feeType: FeeType | null; specification: FeeSpecification | null })[];
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
          fee_items: { include: { feeType: true, specification: true } },
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
          fee_items: { include: { feeType: true, specification: true } },
        },
      }) as Promise<LeaseWithRelations[]>;
    },

    create: async (data: Prisma.LeaseCreateInput) => {
      return db.lease.create({ data });
    },

    createWithRoomUpdate: async (leaseData: Prisma.LeaseCreateInput, roomId: string) => {
      if (!prismaClient) {
        throw new Error('Transaction not available');
      }

      const [lease] = await prismaClient.$transaction([
        db.lease.create({ data: leaseData }),
        db.room.update({
          where: { id: roomId },
          data: { status: 'occupied' },
        }),
      ]);

      return lease;
    },

    update: async (id: string, data: Prisma.LeaseUpdateInput) => {
      return db.lease.update({ where: { id }, data });
    },

    terminate: async (id: string, roomId: string) => {
      if (!prismaClient) {
        // 如果不在事务中，分步执行
        await db.lease.update({ where: { id }, data: { is_active: false } });
        const otherActive = await db.lease.count({
          where: { room_id: roomId, is_active: true, id: { not: id } },
        });
        if (otherActive === 0) {
          await db.room.update({ where: { id: roomId }, data: { status: 'available' } });
        }
        return;
      }

      await prismaClient.$transaction(async (tx) => {
        await tx.lease.update({ where: { id }, data: { is_active: false } });
        const otherActive = await tx.lease.count({
          where: { room_id: roomId, is_active: true, id: { not: id } },
        });
        if (otherActive === 0) {
          await tx.room.update({ where: { id: roomId }, data: { status: 'available' } });
        }
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
  };
}

/**
 * 默认 Lease Repository 实例
 */
export const defaultLeaseRepo = createLeaseRepository(prisma);
