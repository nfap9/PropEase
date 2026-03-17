import type { Prisma, Apartment, Room } from '@prisma/client';
import type { DbClient } from '../types/repository.types.js';
import { prisma } from '../lib/prisma.js';

/**
 * 公寓包含房间的类型
 */
export type ApartmentWithRooms = Apartment & { rooms: Room[] };

/**
 * 公寓统计信息
 */
export interface RoomStats {
  total: number;
  available: number;
  occupied: number;
  maintenance: number;
}

/**
 * 公寓带统计信息
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
        include: { rooms: true },
      });
    },

    findByOrgId: async (orgId: string) => {
      return db.apartment.findMany({ where: { organization_id: orgId } });
    },

    findByOrgIdWithRooms: async (orgId: string) => {
      return db.apartment.findMany({
        where: { organization_id: orgId },
        include: { rooms: true },
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
 */
export function calculateRoomStats(rooms: Room[]): RoomStats {
  return {
    total: rooms.length,
    available: rooms.filter((r) => r.status === 'available').length,
    occupied: rooms.filter((r) => r.status === 'occupied').length,
    maintenance: rooms.filter((r) => r.status === 'maintenance').length,
  };
}

/**
 * 默认 Apartment Repository 实例
 */
export const defaultApartmentRepo = createApartmentRepository(prisma);
