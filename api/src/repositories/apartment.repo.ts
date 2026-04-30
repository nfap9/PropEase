import type { Prisma, Apartment, Room, Lease } from '@prisma/client';
import type { DbClient } from '../types/repository.types.js';
import { prisma } from '../lib/prisma.js';
import type { RoomStats } from '@propease/api-contract';

/**
 * 房间带活跃租约信息的类型
 */
type RoomWithActiveLease = Room & {
  leases: Pick<Lease, 'id' | 'is_active'>[];
};

/**
 * 公寓包含房间的类型
 */
export type ApartmentWithRooms = Apartment & { rooms: RoomWithActiveLease[] };

/**
 * 公寓带统计信息（本地扩展，保留 rooms 字段，room_stats 来自 api-contract）
 */
export type ApartmentWithStats = Apartment & {
  rooms: Room[];
  room_stats: RoomStats;
};

/**
 * Apartment Repository 接口
 */
export interface ApartmentRepository {
  findById(id: string): Promise<Apartment | null>;
  findByIdAndOrg(id: string, orgId: string): Promise<Apartment | null>;
  findByIdAndOrgWithRooms(id: string, orgId: string): Promise<ApartmentWithRooms | null>;
  findByOrgId(orgId: string): Promise<Apartment[]>;
  findByOrgIdWithRooms(orgId: string): Promise<ApartmentWithRooms[]>;
  create(data: Prisma.ApartmentCreateInput): Promise<Apartment>;
  update(id: string, data: Prisma.ApartmentUpdateInput): Promise<Apartment>;
  delete(id: string): Promise<void>;
  countByOrgId(orgId: string): Promise<number>;
}

/**
 * 创建 Apartment Repository 实例
 */
export function createApartmentRepository(db: DbClient): ApartmentRepository {
  return {
    findById: async (id: string) => {
      return db.apartment.findUnique({ where: { id } });
    },

    findByIdAndOrg: async (id: string, orgId: string) => {
      return db.apartment.findFirst({ where: { id, organization_id: orgId } });
    },

    findByIdAndOrgWithRooms: async (id: string, orgId: string) => {
      return db.apartment.findFirst({
        where: { id, organization_id: orgId },
        include: {
          rooms: {
            include: {
              leases: {
                where: { is_active: true },
                select: { id: true, is_active: true },
              },
            },
          },
        },
      });
    },

    findByOrgId: async (orgId: string) => {
      return db.apartment.findMany({ where: { organization_id: orgId } });
    },

    findByOrgIdWithRooms: async (orgId: string) => {
      return db.apartment.findMany({
        where: { organization_id: orgId },
        include: {
          rooms: {
            include: {
              leases: {
                where: { is_active: true },
                select: { id: true, is_active: true },
              },
            },
          },
        },
      });
    },

    create: async (data: Prisma.ApartmentCreateInput) => {
      return db.apartment.create({ data });
    },

    update: async (id: string, data: Prisma.ApartmentUpdateInput) => {
      return db.apartment.update({ where: { id }, data });
    },

    delete: async (id: string) => {
      await db.apartment.delete({ where: { id } });
    },

    countByOrgId: async (orgId: string) => {
      return db.apartment.count({ where: { organization_id: orgId } });
    },
  };
}

/**
 * 计算房间统计信息
 * 状态现在由 maintenance 标记和活跃租约自动计算
 */
export function calculateRoomStats(rooms: RoomWithActiveLease[]): RoomStats {
  const stats = {
    total: rooms.length,
    available: 0,
    occupied: 0,
    maintenance: 0,
  };

  for (const room of rooms) {
    if (room.maintenance) {
      stats.maintenance++;
    } else {
      const hasActiveLease = room.leases && room.leases.some((l) => l.is_active);
      if (hasActiveLease) {
        stats.occupied++;
      } else {
        stats.available++;
      }
    }
  }

  return stats;
}

/**
 * 默认 Apartment Repository 实例
 */
export const defaultApartmentRepo = createApartmentRepository(prisma);
