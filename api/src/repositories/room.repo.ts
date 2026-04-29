import type { Prisma, Room, Apartment, Lease, Tenant, ApartmentConfig } from '@prisma/client';
import type { DbClient } from '../types/repository.types.js';
import { prisma } from '../lib/prisma.js';

/**
 * 房间包含公寓信息
 */
export type RoomWithApartment = Room & {
  apartment: { id: string; name: string; organization_id: string };
};

/**
 * 房间包含公寓和租约信息
 */
export type RoomWithLease = Room & {
  apartment: Apartment & { config: ApartmentConfig | null };
  leases: (Lease & { tenant: Tenant })[];
};

/**
 * Room Repository 接口
 */
export interface RoomRepository {
  findById(id: string): Promise<Room | null>;
  findByIdWithApartment(id: string): Promise<RoomWithApartment | null>;
  findByIdWithLeases(id: string): Promise<Room & { leases: { is_active: boolean }[] } | null>;
  findByApartmentId(apartmentId: string): Promise<Room[]>;
  findByOrgId(orgId: string): Promise<Room[]>;
  findByOrgIdWithLeases(orgId: string): Promise<RoomWithLease[]>;
  findByOrgIdWithLeasesAll(orgId: string): Promise<RoomWithLease[]>;
  create(data: Prisma.RoomCreateInput): Promise<Room>;
  createBatch(rooms: Array<Prisma.RoomCreateInput>): Promise<Room[]>;
  update(id: string, data: Prisma.RoomUpdateInput): Promise<Room>;
  delete(id: string): Promise<void>;
  countByOrgId(orgId: string): Promise<number>;
}

/**
 * 创建 Room Repository 实例
 */
export function createRoomRepository(db: DbClient): RoomRepository {
  return {
    findById: async (id: string) => {
      return db.room.findUnique({ where: { id } });
    },

    findByIdWithApartment: async (id: string) => {
      return db.room.findFirst({
        where: { id },
        include: { apartment: { select: { id: true, name: true, organization_id: true } } },
      }) as Promise<RoomWithApartment | null>;
    },

    findByIdWithLeases: async (id: string) => {
      return db.room.findUnique({
        where: { id },
        include: {
          leases: {
            where: { is_active: true },
            select: { id: true, is_active: true },
          },
        },
      });
    },

    findByApartmentId: async (apartmentId: string) => {
      return db.room.findMany({
        where: { apartment_id: apartmentId },
        include: {
          leases: {
            where: { is_active: true },
            select: { id: true, is_active: true },
            take: 1,
          },
          pricing: true,
        },
      });
    },

    findByOrgId: async (orgId: string) => {
      return db.room.findMany({
        where: { apartment: { organization_id: orgId } },
      });
    },

    findByOrgIdWithLeases: async (orgId: string) => {
      // 查询有活跃租约的房间
      return db.room.findMany({
        where: {
          apartment: { organization_id: orgId },
          leases: { some: { is_active: true } },
        },
        include: {
          apartment: { include: { config: true } },
          leases: {
            where: { is_active: true },
            include: { tenant: true },
            take: 1,
            orderBy: { start_date: 'desc' },
          },
        },
      }) as Promise<RoomWithLease[]>;
    },

    findByOrgIdWithLeasesAll: async (orgId: string) => {
      return db.room.findMany({
        where: { apartment: { organization_id: orgId } },
        include: {
          apartment: { include: { config: true } },
          leases: {
            where: { is_active: true },
            include: { tenant: true },
            take: 1,
            orderBy: { start_date: 'desc' },
          },
        },
      }) as Promise<RoomWithLease[]>;
    },

    create: async (data: Prisma.RoomCreateInput) => {
      return db.room.create({ data });
    },

    createBatch: async (rooms: Array<Prisma.RoomCreateInput>) => {
      return Promise.all(rooms.map((data) => db.room.create({ data })));
    },

    update: async (id: string, data: Prisma.RoomUpdateInput) => {
      return db.room.update({ where: { id }, data });
    },

    delete: async (id: string) => {
      await db.room.delete({ where: { id } });
    },

    countByOrgId: async (orgId: string) => {
      return db.room.count({
        where: { apartment: { organization_id: orgId } },
      });
    },
  };
}

/**
 * 默认 Room Repository 实例
 */
export const defaultRoomRepo = createRoomRepository(prisma);
