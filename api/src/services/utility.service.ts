import type { UtilityReading, Prisma } from '../generated/client/index.js';
import { ulid } from 'ulid';
import { createUtilityRepository, type UtilityRepository, type ReadingWithRelations, type ReadingFilter } from '../repositories/utility.repo.js';
import { createAppError } from '../utils/appError.js';
import { NotFoundMessages } from '../messages.js';
import { prisma } from '../lib/prisma.js';

/**
 * 创建读数输入
 */
export interface CreateReadingInput {
  room_id: string;
  period_year: number;
  period_month: number;
  reading_date: string;
  water_reading?: number;
  electricity_reading?: number;
  water_previous?: number;
  electricity_previous?: number;
  notes?: string;
}

/**
 * 批量创建读数输入
 */
export interface BatchReadingInput {
  period_year: number;
  period_month: number;
  reading_date: string;
  readings: Array<{
    room_id: string;
    water_reading?: number;
    electricity_reading?: number;
    notes?: string;
  }>;
}

/**
 * 更新读数输入
 */
export interface UpdateReadingInput {
  room_id?: string;
  period_year?: number;
  period_month?: number;
  reading_date?: string;
  water_reading?: number;
  electricity_reading?: number;
  water_previous?: number;
  electricity_previous?: number;
  notes?: string;
}

/**
 * 导出房间信息
 */
export interface RoomExportInfo {
  room_id: string;
  apartment_name: string;
  room_number: string;
  tenant_name: string;
  billing_day: number;
  water_previous: number | null;
  electricity_previous: number | null;
}

/**
 * 缺失初始读数房间信息
 */
export interface MissingInitialRoom {
  room_id: string;
  apartment_name: string;
  room_number: string;
  tenant_name: string;
  lease_start_date: string;
}

/**
 * Utility Service 接口
 */
export interface UtilityService {
  list(orgId: string, filter?: ReadingFilter): Promise<ReadingWithRelations[]>;
  getById(orgId: string, id: string): Promise<ReadingWithRelations>;
  create(orgId: string, data: CreateReadingInput): Promise<UtilityReading>;
  batchCreate(orgId: string, data: BatchReadingInput): Promise<UtilityReading[]>;
  update(orgId: string, id: string, data: UpdateReadingInput): Promise<UtilityReading>;
  delete(orgId: string, id: string): Promise<void>;
  getMissingInitialReadings(orgId: string): Promise<MissingInitialRoom[]>;
  getExportList(orgId: string, periodYear?: number, periodMonth?: number, daysRange?: number): Promise<RoomExportInfo[]>;
}

/**
 * 构建读数创建数据
 */
function buildCreateData(data: CreateReadingInput): Prisma.UtilityReadingCreateInput {
  return {
    id: ulid().toLowerCase(),
    room: { connect: { id: data.room_id } },
    period_year: data.period_year,
    period_month: data.period_month,
    reading_date: new Date(data.reading_date),
    water_reading: data.water_reading,
    electricity_reading: data.electricity_reading,
    water_previous: data.water_previous,
    electricity_previous: data.electricity_previous,
    notes: data.notes,
  };
}

/**
 * 构建读数更新数据
 */
function buildUpdateData(data: UpdateReadingInput): Prisma.UtilityReadingUpdateInput {
  const updateData: Prisma.UtilityReadingUpdateInput = {};
  if (data.room_id != null) updateData.room = { connect: { id: data.room_id } };
  if (data.period_year != null) updateData.period_year = data.period_year;
  if (data.period_month != null) updateData.period_month = data.period_month;
  if (data.reading_date != null) updateData.reading_date = new Date(data.reading_date);
  if (data.water_reading !== undefined) updateData.water_reading = data.water_reading;
  if (data.electricity_reading !== undefined) updateData.electricity_reading = data.electricity_reading;
  if (data.water_previous !== undefined) updateData.water_previous = data.water_previous;
  if (data.electricity_previous !== undefined) updateData.electricity_previous = data.electricity_previous;
  if (data.notes !== undefined) updateData.notes = data.notes;
  return updateData;
}

/**
 * 创建 Utility Service 实例
 */
export function createUtilityService(
  getRepo: () => UtilityRepository = () => createUtilityRepository(prisma)
): UtilityService {
  return {
    list: async (orgId: string, filter?: ReadingFilter) => {
      return getRepo().findByOrgId(orgId, filter);
    },

    getById: async (orgId: string, id: string) => {
      const reading = await getRepo().findByIdWithRelations(id);
      if (!reading || reading.room.apartment.organization_id !== orgId) {
        throw createAppError(404, NotFoundMessages.READING);
      }
      return reading;
    },

    create: async (orgId: string, data: CreateReadingInput) => {
      const room = await prisma.room.findFirst({
        where: { id: data.room_id },
        include: { apartment: true },
      });
      if (!room || room.apartment.organization_id !== orgId) {
        throw createAppError(404, NotFoundMessages.ROOM);
      }
      return getRepo().create(buildCreateData(data));
    },

    batchCreate: async (orgId: string, data: BatchReadingInput) => {
      const orgRoomIds = new Set(await getRepo().getRoomIdsByOrg(orgId));
      const readingDate = new Date(data.reading_date);

      const readingsData = data.readings.map((r) => {
        if (!orgRoomIds.has(r.room_id)) {
          throw createAppError(404, NotFoundMessages.ROOM);
        }
        return {
          id: ulid().toLowerCase(),
          room: { connect: { id: r.room_id } },
          period_year: data.period_year,
          period_month: data.period_month,
          reading_date: readingDate,
          water_reading: r.water_reading,
          electricity_reading: r.electricity_reading,
          notes: r.notes,
        };
      });

      return getRepo().createBatch(readingsData);
    },

    update: async (orgId: string, id: string, data: UpdateReadingInput) => {
      const existing = await getRepo().findByIdWithRelations(id);
      if (!existing || existing.room.apartment.organization_id !== orgId) {
        throw createAppError(404, NotFoundMessages.READING);
      }
      return getRepo().update(id, buildUpdateData(data));
    },

    delete: async (orgId: string, id: string) => {
      const existing = await getRepo().findByIdWithRelations(id);
      if (!existing || existing.room.apartment.organization_id !== orgId) {
        throw createAppError(404, NotFoundMessages.READING);
      }
      await getRepo().delete(id);
    },

    getMissingInitialReadings: async (orgId: string) => {
      const rooms = await prisma.room.findMany({
        where: { apartment: { organization_id: orgId }, status: 'occupied' },
        include: {
          apartment: true,
          leases: {
            where: { is_active: true },
            include: { tenant: true },
            take: 1,
            orderBy: { start_date: 'desc' },
          },
        },
      });

      const result: MissingInitialRoom[] = [];

      for (const r of rooms) {
        const lease = r.leases[0];
        if (!lease) continue;

        const start = lease.start_date;
        const periodYear = start.getFullYear();
        const periodMonth = start.getMonth() + 1;

        const existing = await getRepo().findExistingReading(r.id, periodYear, periodMonth);
        if (existing) continue;

        result.push({
          room_id: r.id,
          apartment_name: r.apartment.name,
          room_number: r.room_number,
          tenant_name: lease.tenant?.name ?? '',
          lease_start_date: start.toISOString().split('T')[0],
        });
      }

      return result;
    },

    getExportList: async (orgId: string, periodYear?: number, periodMonth?: number, daysRange?: number) => {
      const rooms = await prisma.room.findMany({
        where: { apartment: { organization_id: orgId } },
        include: {
          apartment: true,
          leases: {
            where: { is_active: true },
            include: { tenant: true },
            take: 1,
            orderBy: { start_date: 'desc' },
          },
        },
      });

      let roomsToExport = rooms;

      // 按出账日筛选
      if (periodYear != null && periodMonth != null && daysRange != null && daysRange > 0) {
        const today = new Date();
        const currentDay = today.getDate();
        const daysInMonth = new Date(periodYear, periodMonth, 0).getDate();
        const billingDays = new Set<number>();
        for (let i = 0; i < daysRange; i++) {
          let d = currentDay + i;
          if (d > daysInMonth) d -= daysInMonth;
          billingDays.add(d);
        }
        roomsToExport = rooms.filter((r) => {
          const lease = r.leases[0];
          return lease && billingDays.has(lease.billing_day);
        });
      }

      // 排除已有读数的房间
      if (periodYear != null && periodMonth != null && roomsToExport.length > 0) {
        const roomIdsWithReadings = new Set(
          (
            await prisma.utilityReading.findMany({
              where: {
                room_id: { in: roomsToExport.map((r) => r.id) },
                period_year: periodYear,
                period_month: periodMonth,
              },
              select: { room_id: true },
            })
          ).map((r) => r.room_id)
        );
        roomsToExport = roomsToExport.filter((r) => !roomIdsWithReadings.has(r.id));
      }

      const period = periodYear != null && periodMonth != null ? { year: periodYear, month: periodMonth } : null;

      const exportList = await Promise.all(
        roomsToExport.map(async (r) => {
          const lease = r.leases[0];
          let waterPrevious: number | null = null;
          let electricityPrevious: number | null = null;

          if (period) {
            const prev = await getRepo().findExistingReading(r.id, period.year, period.month);
            if (prev) {
              waterPrevious = prev.water_reading != null ? Number(prev.water_reading) : null;
              electricityPrevious = prev.electricity_reading != null ? Number(prev.electricity_reading) : null;
            }
          }

          return {
            room_id: r.id,
            apartment_name: r.apartment.name,
            room_number: r.room_number,
            tenant_name: lease?.tenant?.name ?? '',
            billing_day: lease?.billing_day ?? 1,
            water_previous: waterPrevious,
            electricity_previous: electricityPrevious,
          };
        })
      );

      return exportList;
    },
  };
}

/**
 * 默认实例
 */
export const defaultUtilityService = createUtilityService();
