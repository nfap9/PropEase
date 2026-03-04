import type {
  Prisma,
  UtilityReading,
  Room,
  Apartment,
  Lease,
  Tenant,
} from '../generated/client/index.js';
import type { DbClient } from '../types/repository.types.js';
import { prisma } from '../lib/prisma.js';

/**
 * 读数包含关联信息
 */
export type ReadingWithRelations = UtilityReading & {
  room: Room & { apartment: Apartment };
};

/**
 * 房间包含租约信息
 */
export type RoomWithLease = Room & {
  apartment: Apartment;
  leases: (Lease & { tenant: Tenant })[];
};

/**
 * 查询读数的过滤条件
 */
export interface ReadingFilter {
  roomId?: string;
  apartmentId?: string;
  periodYear?: number;
  periodMonth?: number;
}

/**
 * Utility Repository 接口
 */
export interface UtilityRepository {
  findById(id: string): Promise<UtilityReading | null>;
  findByIdWithRelations(id: string): Promise<ReadingWithRelations | null>;
  findByOrgId(orgId: string, filter?: ReadingFilter): Promise<ReadingWithRelations[]>;
  create(data: Prisma.UtilityReadingCreateInput): Promise<UtilityReading>;
  createBatch(readings: Array<Prisma.UtilityReadingCreateInput>): Promise<UtilityReading[]>;
  update(id: string, data: Prisma.UtilityReadingUpdateInput): Promise<UtilityReading>;
  delete(id: string): Promise<void>;
  findExistingReading(
    roomId: string,
    periodYear: number,
    periodMonth: number
  ): Promise<UtilityReading | null>;
  getRoomIdsByOrg(orgId: string): Promise<string[]>;
}

/**
 * 创建 Utility Repository 实例
 */
export function createUtilityRepository(db: DbClient): UtilityRepository {
  const prismaClient = '$transaction' in db ? db : null;

  return {
    findById: async (id: string) => {
      return db.utilityReading.findUnique({ where: { id } });
    },

    findByIdWithRelations: async (id: string) => {
      return db.utilityReading.findFirst({
        where: { id },
        include: { room: { include: { apartment: true } } },
      }) as Promise<ReadingWithRelations | null>;
    },

    findByOrgId: async (orgId: string, filter?: ReadingFilter) => {
      const roomsWhere: Prisma.RoomWhereInput = {
        apartment: { organization_id: orgId },
      };
      if (filter?.apartmentId) roomsWhere.apartment_id = filter.apartmentId;

      const rooms = await db.room.findMany({
        where: roomsWhere,
        select: { id: true },
      });
      const roomIds = rooms.map((r) => r.id);

      const where: Prisma.UtilityReadingWhereInput = {};

      if (filter?.roomId && roomIds.includes(filter.roomId)) {
        where.room_id = filter.roomId;
      } else {
        where.room_id = { in: roomIds };
      }

      if (filter?.periodYear != null) where.period_year = filter.periodYear;
      if (filter?.periodMonth != null) where.period_month = filter.periodMonth;

      return db.utilityReading.findMany({
        where,
        include: { room: { include: { apartment: true } } },
      }) as Promise<ReadingWithRelations[]>;
    },

    create: async (data: Prisma.UtilityReadingCreateInput) => {
      return db.utilityReading.create({ data });
    },

    createBatch: async (readings: Array<Prisma.UtilityReadingCreateInput>) => {
      if (!prismaClient) {
        return Promise.all(readings.map((data) => db.utilityReading.create({ data })));
      }

      return prismaClient.$transaction(readings.map((data) => db.utilityReading.create({ data })));
    },

    update: async (id: string, data: Prisma.UtilityReadingUpdateInput) => {
      return db.utilityReading.update({ where: { id }, data });
    },

    delete: async (id: string) => {
      await db.utilityReading.delete({ where: { id } });
    },

    findExistingReading: async (roomId: string, periodYear: number, periodMonth: number) => {
      return db.utilityReading.findFirst({
        where: { room_id: roomId, period_year: periodYear, period_month: periodMonth },
      });
    },

    getRoomIdsByOrg: async (orgId: string) => {
      const rooms = await db.room.findMany({
        where: { apartment: { organization_id: orgId } },
        select: { id: true },
      });
      return rooms.map((r) => r.id);
    },
  };
}

/**
 * 默认实例
 */
export const defaultUtilityRepo = createUtilityRepository(prisma);
