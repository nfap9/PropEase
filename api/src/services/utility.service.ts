import type { UtilityReading, Prisma } from '@prisma/client';
import { ulid } from 'ulid';
import {
  createUtilityRepository,
  type UtilityRepository,
  type ReadingWithRelations,
  type ReadingFilter,
} from '../repositories/utility.repo.js';
import { createAppError } from '../utils/appError.js';
import { NotFoundMessages } from '../messages.js';
import { prisma } from '../lib/prisma.js';
import {
  compareDateDesc,
  compareNaturalText,
  compareNumberDesc,
} from '../utils/intuitiveSort.js';

export type ReadingContext = 'normal' | 'initial' | 'meter_reset';

interface NormalizedReadingPayload {
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
  reading_context?: ReadingContext;
  anomaly_reason?: string;
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
  reading_context?: ReadingContext;
  anomaly_reason?: string;
}

const meterValidationConfigs = [
  {
    label: '水表',
    currentKey: 'water_reading',
    previousKey: 'water_previous',
    absoluteSpikeThreshold: 80,
  },
  {
    label: '电表',
    currentKey: 'electricity_reading',
    previousKey: 'electricity_previous',
    absoluteSpikeThreshold: 600,
  },
] as const;

function formatDecimal(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function buildContextNotes(
  context: ReadingContext,
  anomalyReason?: string,
  notes?: string
): string | undefined {
  const normalizedNotes = notes?.trim();
  const normalizedReason = anomalyReason?.trim();
  const contextSummary =
    context === 'initial'
      ? '【读数上下文】首次录入；系统已将上一读数同步为当前值'
      : context === 'meter_reset'
        ? `【读数上下文】更换新表${normalizedReason ? `；原因：${normalizedReason}` : ''}`
        : normalizedReason
          ? `【异常说明】${normalizedReason}`
          : null;

  if (!contextSummary) {
    return normalizedNotes || undefined;
  }

  return [contextSummary, normalizedNotes].filter(Boolean).join('\n');
}

async function normalizeReadingPayload(
  repo: UtilityRepository,
  data: NormalizedReadingPayload & {
    reading_context?: ReadingContext;
    anomaly_reason?: string;
  },
  existing?: ReadingWithRelations | null
): Promise<NormalizedReadingPayload> {
  const context = data.reading_context ?? 'normal';
  const anomalyReason = data.anomaly_reason?.trim();
  const previousReading = await repo.findLatestReadingBefore(
    data.room_id,
    data.period_year,
    data.period_month
  );
  const fieldErrors: Array<{ field: string; message: string }> = [];
  const normalized: NormalizedReadingPayload = {
    room_id: data.room_id,
    period_year: data.period_year,
    period_month: data.period_month,
    reading_date: data.reading_date,
    water_reading: data.water_reading,
    electricity_reading: data.electricity_reading,
    water_previous: data.water_previous,
    electricity_previous: data.electricity_previous,
    notes: buildContextNotes(context, anomalyReason, data.notes),
  };

  if (context === 'initial' && previousReading) {
    fieldErrors.push({
      field: 'reading_context',
      message: '该房间已有历史读数，不能再使用“首次录入”建立基线。',
    });
  }

  if (context === 'meter_reset' && !anomalyReason) {
    fieldErrors.push({
      field: 'anomaly_reason',
      message: '更换新表时请填写原因，便于后续追溯。',
    });
  }

  for (const config of meterValidationConfigs) {
    const nextCurrentValue = normalized[config.currentKey];
    if (nextCurrentValue == null) {
      continue;
    }

    const explicitPrevious = normalized[config.previousKey];
    const historicalCurrent = previousReading?.[config.currentKey];
    const historicalPrevious = previousReading?.[config.previousKey];
    const latestCurrentValue =
      historicalCurrent != null ? Number(historicalCurrent) : undefined;
    const previousUsage =
      historicalCurrent != null && historicalPrevious != null
        ? Number(historicalCurrent) - Number(historicalPrevious)
        : undefined;

    let previousValue = explicitPrevious;

    if (previousValue == null) {
      // 首次录入场景：没有历史读数时，用当前读数作为上一期
      if (context === 'initial' && !previousReading) {
        previousValue = nextCurrentValue;
      }
      // 正常抄表场景：没有历史读数时，自动按首次录入处理
      else if (!previousReading) {
        previousValue = nextCurrentValue;
      } else if (latestCurrentValue != null) {
        previousValue = latestCurrentValue;
      }
    }

    if (previousValue == null) {
      fieldErrors.push({
        field: config.previousKey,
        message: `缺少${config.label}上一期读数，请先建立首次读数基线，或在换表时手动填写上一读数。`,
      });
      continue;
    }

    if (nextCurrentValue < previousValue) {
      if (context === 'meter_reset' && explicitPrevious != null) {
        normalized[config.previousKey] = explicitPrevious;
      } else {
        fieldErrors.push({
          field: config.currentKey,
          message: `${config.label}当前读数 ${formatDecimal(nextCurrentValue)} 小于上一读数 ${formatDecimal(previousValue)}，请确认是否为换表场景。`,
        });
        continue;
      }
    } else {
      normalized[config.previousKey] = previousValue;
    }

    const usage = nextCurrentValue - (normalized[config.previousKey] ?? previousValue);
    const spikeThreshold = Math.max(
      config.absoluteSpikeThreshold,
      previousUsage != null && previousUsage > 0 ? previousUsage * 3 : 0
    );

    if (usage > spikeThreshold && !anomalyReason) {
      fieldErrors.push({
        field: 'anomaly_reason',
        message: `${config.label}本期用量 ${formatDecimal(usage)} 明显异常，请补充原因后再保存。`,
      });
    }
  }

  if (fieldErrors.length > 0) {
    throw createAppError(422, '读数校验未通过，请检查异常提示后重试。', {
      fieldErrors,
    });
  }

  if (existing) {
    if (data.water_reading === undefined) {
      normalized.water_reading =
        existing.water_reading != null ? Number(existing.water_reading) : undefined;
    }
    if (data.electricity_reading === undefined) {
      normalized.electricity_reading =
        existing.electricity_reading != null ? Number(existing.electricity_reading) : undefined;
    }
    if (data.notes === undefined && context === 'normal' && !anomalyReason) {
      normalized.notes = existing.notes ?? undefined;
    }
  }

  return normalized;
}

/**
 * 导出房间信息
 */
export interface RoomExportInfo {
  room_id: string;
  apartment_id: string;
  apartment_name: string;
  room_number: string;
  tenant_name: string;
  tenant_phone: string;
  billing_day: number;
  water_previous: number | null;
  electricity_previous: number | null;
  water_unit_price: number | null;
  electricity_unit_price: number | null;
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
  getExportList(
    orgId: string,
    periodYear?: number,
    periodMonth?: number,
    daysRange?: number
  ): Promise<RoomExportInfo[]>;
  getLatestReadingsBefore(
    orgId: string,
    periodYear: number,
    periodMonth: number
  ): Promise<Record<string, UtilityReading>>;
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
  if (data.electricity_reading !== undefined)
    updateData.electricity_reading = data.electricity_reading;
  if (data.water_previous !== undefined) updateData.water_previous = data.water_previous;
  if (data.electricity_previous !== undefined)
    updateData.electricity_previous = data.electricity_previous;
  if (data.notes !== undefined) updateData.notes = data.notes;
  return updateData;
}

/**
 * 创建 Utility Service 实例
 */
export function createUtilityService(
  getRepo: () => UtilityRepository = () => createUtilityRepository(prisma)
): UtilityService {
  const sortReadings = (readings: ReadingWithRelations[]) =>
    [...readings].sort(
      (left, right) =>
        compareNumberDesc(left.period_year, right.period_year) ||
        compareNumberDesc(left.period_month, right.period_month) ||
        compareNaturalText(left.room.apartment.name, right.room.apartment.name) ||
        compareNaturalText(left.room.room_number, right.room.room_number) ||
        compareDateDesc(left.reading_date, right.reading_date)
    );

  return {
    list: async (orgId: string, filter?: ReadingFilter) => {
      const readings = await getRepo().findByOrgId(orgId, filter);
      return sortReadings(readings);
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

      // 检查是否已存在相同 room_id + period_year + period_month 的记录
      const repo = getRepo();
      const existing = await repo.findExistingReading(data.room_id, data.period_year, data.period_month);
      if (existing) {
        throw createAppError(
          409,
          `该房间 ${data.period_year}年${data.period_month}月 的水电读数已存在（记录ID: ${existing.id}），请返回列表页面修改或删除已有记录后重试。`
        );
      }

      const normalized = await normalizeReadingPayload(repo, data);
      return repo.create(buildCreateData(normalized));
    },

    batchCreate: async (orgId: string, data: BatchReadingInput) => {
      const repo = getRepo();
      const orgRoomIds = new Set(await repo.getRoomIdsByOrg(orgId));
      const readingDate = new Date(data.reading_date);

      // 批量检查哪些房间已存在该账期的读数
      const roomIds = data.readings.map((r) => r.room_id);
      const existingReadings = await prisma.utilityReading.findMany({
        where: {
          room_id: { in: roomIds },
          period_year: data.period_year,
          period_month: data.period_month,
        },
        select: { room_id: true },
      });
      const existingRoomIds = new Set(existingReadings.map((r) => r.room_id));
      if (existingRoomIds.size > 0) {
        throw createAppError(
          409,
          `以下房间 ${data.period_year}年${data.period_month}月 的水电读数已存在：${Array.from(existingRoomIds).join(', ')}。请先删除已有记录后重试。`
        );
      }

      const readingsData = await Promise.all(data.readings.map(async (r) => {
        if (!orgRoomIds.has(r.room_id)) {
          throw createAppError(404, NotFoundMessages.ROOM);
        }
        const normalized = await normalizeReadingPayload(repo, {
          room_id: r.room_id,
          period_year: data.period_year,
          period_month: data.period_month,
          reading_date: data.reading_date,
          water_reading: r.water_reading,
          electricity_reading: r.electricity_reading,
          notes: r.notes,
        });
        return {
          id: ulid().toLowerCase(),
          room: { connect: { id: r.room_id } },
          period_year: data.period_year,
          period_month: data.period_month,
          reading_date: readingDate,
          water_reading: normalized.water_reading,
          electricity_reading: normalized.electricity_reading,
          water_previous: normalized.water_previous,
          electricity_previous: normalized.electricity_previous,
          notes: normalized.notes,
        };
      }));

      return repo.createBatch(readingsData);
    },

    update: async (orgId: string, id: string, data: UpdateReadingInput) => {
      const repo = getRepo();
      const existing = await repo.findByIdWithRelations(id);
      if (!existing || existing.room.apartment.organization_id !== orgId) {
        throw createAppError(404, NotFoundMessages.READING);
      }
      const normalized = await normalizeReadingPayload(
        repo,
        {
          room_id: data.room_id ?? existing.room_id,
          period_year: data.period_year ?? existing.period_year,
          period_month: data.period_month ?? existing.period_month,
          reading_date:
            data.reading_date ?? existing.reading_date.toISOString().slice(0, 10),
          water_reading:
            data.water_reading ??
            (existing.water_reading != null ? Number(existing.water_reading) : undefined),
          electricity_reading:
            data.electricity_reading ??
            (existing.electricity_reading != null
              ? Number(existing.electricity_reading)
              : undefined),
          water_previous: data.water_previous,
          electricity_previous: data.electricity_previous,
          notes: data.notes,
          reading_context: data.reading_context,
          anomaly_reason: data.anomaly_reason,
        },
        existing
      );
      return repo.update(id, buildUpdateData(normalized));
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

      return result.sort(
        (left, right) =>
          compareNaturalText(left.apartment_name, right.apartment_name) ||
          compareNaturalText(left.room_number, right.room_number) ||
          compareNaturalText(left.tenant_name, right.tenant_name)
      );
    },

    getExportList: async (
      orgId: string,
      periodYear?: number,
      periodMonth?: number,
      daysRange?: number
    ) => {
      const rooms = await prisma.room.findMany({
        where: { apartment: { organization_id: orgId } },
        include: {
          apartment: { include: { utility_config: true } },
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

      const period =
        periodYear != null && periodMonth != null ? { year: periodYear, month: periodMonth } : null;

      const exportList = await Promise.all(
        roomsToExport.map(async (r) => {
          const lease = r.leases[0];
          let waterPrevious: number | null = null;
          let electricityPrevious: number | null = null;
          let waterUnitPrice: number | null = null;
          let electricityUnitPrice: number | null = null;

          if (period) {
            const prev = await getRepo().findLatestReadingBefore(r.id, period.year, period.month);
            if (prev) {
              waterPrevious = prev.water_reading != null ? Number(prev.water_reading) : null;
              electricityPrevious =
                prev.electricity_reading != null ? Number(prev.electricity_reading) : null;
            }
          }

          if (lease) {
            const leaseWaterRate = Number(lease.water_rate);
            const leaseElectricityRate = Number(lease.electricity_rate);

            waterUnitPrice =
              leaseWaterRate > 0
                ? leaseWaterRate
                : r.apartment.utility_config?.water_price_per_unit != null
                  ? Number(r.apartment.utility_config.water_price_per_unit)
                  : null;

            electricityUnitPrice =
              leaseElectricityRate > 0
                ? leaseElectricityRate
                : r.apartment.utility_config?.electricity_price_per_unit != null
                  ? Number(r.apartment.utility_config.electricity_price_per_unit)
                  : null;
          }

          return {
            room_id: r.id,
            apartment_id: r.apartment.id,
            apartment_name: r.apartment.name,
            room_number: r.room_number,
            tenant_name: lease?.tenant?.name ?? '',
            tenant_phone: lease?.tenant?.phone ?? '',
            billing_day: lease?.billing_day ?? 1,
            water_previous: waterPrevious,
            electricity_previous: electricityPrevious,
            water_unit_price: waterUnitPrice,
            electricity_unit_price: electricityUnitPrice,
          };
        })
      );

      return exportList.sort(
        (left, right) =>
          compareNaturalText(left.apartment_name, right.apartment_name) ||
          compareNaturalText(left.room_number, right.room_number) ||
          compareNaturalText(left.tenant_name, right.tenant_name)
      );
    },

    getLatestReadingsBefore: async (orgId: string, periodYear: number, periodMonth: number) => {
      const map = await getRepo().findLatestReadingsBeforeForOrg(orgId, periodYear, periodMonth);
      // Convert Map to plain object for JSON serialization
      return Object.fromEntries(map);
    },
  };
}

/**
 * 默认实例
 */
export const defaultUtilityService = createUtilityService();
