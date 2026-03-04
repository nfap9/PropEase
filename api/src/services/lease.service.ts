import type { Lease, Prisma } from '../generated/client/index.js';
import { ulid } from 'ulid';
import {
  createLeaseRepository,
  type LeaseRepository,
  type LeaseWithRelations,
} from '../repositories/lease.repo.js';
import { createAppError } from '../utils/appError.js';
import { NotFoundMessages } from '../messages.js';
import { prisma } from '../lib/prisma.js';

/**
 * 创建租约输入
 */
export interface CreateLeaseInput {
  room_id: string;
  tenant_id: string;
  start_date: string;
  end_date?: string;
  billing_day?: number;
  monthly_rent: number;
  deposit?: number;
  water_rate?: number;
  electricity_rate?: number;
  notes?: string;
}

/**
 * 更新租约输入
 */
export interface UpdateLeaseInput {
  room_id?: string;
  tenant_id?: string;
  start_date?: string;
  end_date?: string;
  billing_day?: number;
  monthly_rent?: number;
  deposit?: number;
  water_rate?: number;
  electricity_rate?: number;
  notes?: string;
}

/**
 * Lease Service 接口
 */
export interface LeaseService {
  list(orgId: string, isActive?: boolean): Promise<LeaseWithRelations[]>;
  getById(orgId: string, id: string): Promise<LeaseWithRelations>;
  create(orgId: string, data: CreateLeaseInput): Promise<Lease>;
  update(orgId: string, id: string, data: UpdateLeaseInput): Promise<Lease>;
  terminate(orgId: string, id: string): Promise<void>;
  delete(orgId: string, id: string): Promise<void>;
}

/**
 * 构建租约创建数据
 */
function buildCreateData(data: CreateLeaseInput): Prisma.LeaseCreateInput {
  return {
    id: ulid().toLowerCase(),
    room: { connect: { id: data.room_id } },
    tenant: { connect: { id: data.tenant_id } },
    start_date: new Date(data.start_date),
    end_date: data.end_date ? new Date(data.end_date) : undefined,
    billing_day: data.billing_day ?? 1,
    monthly_rent: data.monthly_rent,
    deposit: data.deposit ?? 0,
    water_rate: data.water_rate ?? 0,
    electricity_rate: data.electricity_rate ?? 0,
    notes: data.notes,
  };
}

/**
 * 构建租约更新数据
 */
function buildUpdateData(data: UpdateLeaseInput): Prisma.LeaseUpdateInput {
  const updateData: Prisma.LeaseUpdateInput = {};

  if (data.room_id != null) updateData.room = { connect: { id: data.room_id } };
  if (data.tenant_id != null) updateData.tenant = { connect: { id: data.tenant_id } };
  if (data.start_date != null) updateData.start_date = new Date(data.start_date);
  if (data.end_date !== undefined)
    updateData.end_date = data.end_date ? new Date(data.end_date) : null;
  if (data.billing_day != null) updateData.billing_day = data.billing_day;
  if (data.monthly_rent != null) updateData.monthly_rent = data.monthly_rent;
  if (data.deposit != null) updateData.deposit = data.deposit;
  if (data.water_rate != null) updateData.water_rate = data.water_rate;
  if (data.electricity_rate != null) updateData.electricity_rate = data.electricity_rate;
  if (data.notes !== undefined) updateData.notes = data.notes;

  return updateData;
}

/**
 * 创建 Lease Service 实例
 */
export function createLeaseService(
  getRepo: () => LeaseRepository = () => createLeaseRepository(prisma)
): LeaseService {
  return {
    list: async (orgId: string, isActive?: boolean) => {
      return getRepo().findByOrgId(orgId, isActive);
    },

    getById: async (orgId: string, id: string) => {
      const lease = await getRepo().findByIdWithRelations(id);
      if (!lease || lease.room.apartment.organization_id !== orgId) {
        throw createAppError(404, NotFoundMessages.LEASE);
      }
      return lease;
    },

    create: async (orgId: string, data: CreateLeaseInput) => {
      // 验证房间归属
      const room = await prisma.room.findFirst({
        where: { id: data.room_id },
        include: { apartment: true },
      });
      if (!room || room.apartment.organization_id !== orgId) {
        throw createAppError(404, NotFoundMessages.ROOM);
      }

      // 验证租客归属
      const tenant = await prisma.tenant.findFirst({
        where: { id: data.tenant_id, organization_id: orgId },
      });
      if (!tenant) {
        throw createAppError(404, NotFoundMessages.TENANT);
      }

      // 创建租约并更新房间状态（事务）
      return getRepo().createWithRoomUpdate(buildCreateData(data), data.room_id);
    },

    update: async (orgId: string, id: string, data: UpdateLeaseInput) => {
      const existing = await getRepo().findByIdWithRelations(id);
      if (!existing || existing.room.apartment.organization_id !== orgId) {
        throw createAppError(404, NotFoundMessages.LEASE);
      }
      return getRepo().update(id, buildUpdateData(data));
    },

    terminate: async (orgId: string, id: string) => {
      const existing = await getRepo().findByIdWithRelations(id);
      if (!existing || existing.room.apartment.organization_id !== orgId) {
        throw createAppError(404, NotFoundMessages.LEASE);
      }
      await getRepo().terminate(id, existing.room_id);
    },

    delete: async (orgId: string, id: string) => {
      const existing = await getRepo().findByIdWithRelations(id);
      if (!existing || existing.room.apartment.organization_id !== orgId) {
        throw createAppError(404, NotFoundMessages.LEASE);
      }
      await getRepo().delete(id);
    },
  };
}

/**
 * 默认 Lease Service 实例
 */
export const defaultLeaseService = createLeaseService();
