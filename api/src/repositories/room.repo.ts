import type { Prisma, Room } from '@prisma/client';
import type { DbClient } from '../types/repository.types.js';
import { prisma } from '../lib/prisma.js';

/**
 * 房间包含公寓信息
 */
export type RoomWithApartment = Room & { apartment: { id: string; name: string; organization_id: string } };

/**
 * Room Repository 接口
 */
export interface RoomRepository {
  findById(id: string): Promise<Room | null>;
  findByIdWithApartment(id: string): Promise<RoomWithApartment | null>;
  findByApartmentId(apartmentId: string): Promise<Room[]>;
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

    findByApartmentId: async (apartmentId: string) => {
      return db.room.findMany({ where: { apartment_id: apartmentId } });
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
