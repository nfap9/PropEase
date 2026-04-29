import type { Lease, Prisma } from '@prisma/client';
import { ulid } from 'ulid';
import {
  createLeaseRepository,
  type LeaseRepository,
  type LeaseWithRelations,
} from '../repositories/lease.repo.js';
import { createApartmentFeeItemRepository, type ApartmentFeeItemRepository } from '../repositories/apartmentFeeItem.repo.js';
import { createLeaseFeeItemRepository, type LeaseFeeItemRepository } from '../repositories/leaseFeeItem.repo.js';
import { createLeaseChangeLogRepository, type LeaseChangeLogRepository } from '../repositories/leaseChangeLog.repo.js';
import { createRoomRepository, type RoomRepository } from '../repositories/room.repo.js';
import { createTenantRepository, type TenantRepository } from '../repositories/tenant.repo.js';

import { createOrganizationRepository, type OrganizationRepository } from '../repositories/organization.repo.js';
import { createAppError } from '../utils/appError.js';
import { NotFoundMessages } from '../messages.js';
import { logger } from '../utils/logger.js';
import { prisma } from '../lib/prisma.js';
import { defaultBillService, type BillService, type CreateBillInput } from './bill.service.js';
import {
  compareBooleanDesc,
  compareDateDesc,
  compareNaturalText,
} from '../utils/intuitiveSort.js';

/**
 * 租约费用项目输入（直接输入模式）
 */
export interface LeaseFeeItemInput {
  fee_type_id?: string;
  fee_name: string;
  fee_amount: number;
  fee_cycle: 'monthly' | 'quarterly' | 'yearly' | 'one_time';
  quantity?: number;
  notes?: string;
}

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
  fee_items?: LeaseFeeItemInput[];
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
  changeRoom(
    orgId: string,
    leaseId: string,
    newRoomId: string,
    changeDate: string,
    reason?: string
  ): Promise<{ lease_id: string; old_room_id: string; new_room_id: string; changed_at: string }>;
  renew(
    orgId: string,
    leaseId: string,
    newEndDate: string,
    reason?: string
  ): Promise<{ lease_id: string; old_end_date: string; new_end_date: string; renewed_at: string }>;
  updateTenant(
    orgId: string,
    leaseId: string,
    newTenantId: string
  ): Promise<{ lease_id: string; old_tenant_id: string; new_tenant_id: string; updated_at: string }>;
  changeRent(
    orgId: string,
    leaseId: string,
    newRent: number,
    effectiveFromYear: number,
    effectiveFromMonth: number,
    reason?: string
  ): Promise<{
    lease_id: string;
    old_rent: number;
    new_rent: number;
    effective_from: { year: number; month: number };
  }>;
  changeUtilityRates(
    orgId: string,
    leaseId: string,
    waterRate: number,
    electricityRate: number,
    effectiveFromYear: number,
    effectiveFromMonth: number
  ): Promise<{
    lease_id: string;
    old_rates: { water: number; electricity: number };
    new_rates: { water: number; electricity: number };
    effective_from: { year: number; month: number };
  }>;
  changeDeposit(
    orgId: string,
    leaseId: string,
    newDeposit: number,
    reason?: string
  ): Promise<{
    lease_id: string;
    old_deposit: number;
    new_deposit: number;
    difference: number;
    bill_id: string;
    bill_status: string;
  }>;
  updateFeeItems(
    orgId: string,
    leaseId: string,
    feeItems: Array<{ fee_type_id: string; quantity: number }>,
    effectiveFromYear: number,
    effectiveFromMonth: number
  ): Promise<{ lease_id: string; updated_at: string }>;
  setLeaseFeeItems(
    orgId: string,
    leaseId: string,
    feeItems: Array<{
      fee_type_id?: string;
      fee_name: string;
      fee_amount: number;
      fee_cycle: 'monthly' | 'quarterly' | 'yearly' | 'one_time';
      quantity?: number;
      notes?: string;
    }>
  ): Promise<{ lease_id: string; updated_at: string }>;
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
 * 白名单：只允许修改 billing_day 和 notes，其他字段需通过专门操作接口
 */
function buildUpdateData(data: UpdateLeaseInput): Prisma.LeaseUpdateInput {
  const restrictedFields = [
    'room_id',
    'tenant_id',
    'start_date',
    'end_date',
    'monthly_rent',
    'deposit',
    'water_rate',
    'electricity_rate',
  ];

  for (const field of restrictedFields) {
    if (field in data && (data as Record<string, unknown>)[field] !== undefined) {
      throw createAppError(400, `字段 ${field} 需通过专门操作接口修改`);
    }
  }

  const updateData: Prisma.LeaseUpdateInput = {};
  if (data.billing_day != null) updateData.billing_day = data.billing_day;
  if (data.notes !== undefined) updateData.notes = data.notes;

  return updateData;
}

async function notifyOrgAdmins(
  orgId: string,
  type: string,
  title: string,
  content: string,
  extraData: Prisma.InputJsonObject,
  getOrgRepo: () => OrganizationRepository
): Promise<void> {
  const members = await getOrgRepo().findMembersByOrgId(orgId);
  const admins = members.filter((m) => m.role.name === '组织所有者' || m.role.name === '公寓管理人');

  for (const member of admins) {
    await prisma.notification.create({
      data: {
        id: ulid().toLowerCase(),
        user_id: member.user_id,
        organization_id: orgId,
        type,
        title,
        content,
        extra_data: extraData,
      },
    });
  }
}

/**
 * 创建 Lease Service 实例
 */
export function createLeaseService(
  getRepo: () => LeaseRepository = () => createLeaseRepository(prisma),
  getApartmentFeeItemRepo: () => ApartmentFeeItemRepository = () => createApartmentFeeItemRepository(prisma),
  getLeaseFeeItemRepo: () => LeaseFeeItemRepository = () => createLeaseFeeItemRepository(prisma),
  getLeaseChangeLogRepo: () => LeaseChangeLogRepository = () => createLeaseChangeLogRepository(prisma),
  getRoomRepo: () => RoomRepository = () => createRoomRepository(prisma),
  getTenantRepo: () => TenantRepository = () => createTenantRepository(prisma),
  getOrgRepo: () => OrganizationRepository = () => createOrganizationRepository(prisma),
  getBillSvc: () => BillService = () => defaultBillService
): LeaseService {
  const sortLeases = (leases: LeaseWithRelations[]) =>
    [...leases].sort(
      (left, right) =>
        compareBooleanDesc(left.is_active, right.is_active) ||
        compareNaturalText(left.room.apartment.name, right.room.apartment.name) ||
        compareNaturalText(left.room.room_number, right.room.room_number) ||
        compareDateDesc(left.start_date, right.start_date) ||
        compareNaturalText(left.tenant?.name, right.tenant?.name)
    );

  return {
    list: async (orgId: string, isActive?: boolean) => {
      const leases = await getRepo().findByOrgId(orgId, isActive);
      return sortLeases(leases);
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
      const room = await getRoomRepo().findByIdWithApartment(data.room_id);
      if (!room || room.apartment.organization_id !== orgId) {
        throw createAppError(404, NotFoundMessages.ROOM);
      }

      // 验证租客归属
      const tenant = await getTenantRepo().findByIdAndOrg(data.tenant_id, orgId);
      if (!tenant) {
        throw createAppError(404, NotFoundMessages.TENANT);
      }

      // 创建租约并更新房间状态（事务）
      const lease = await getRepo().createWithRoomUpdate(buildCreateData(data), data.room_id);

      // 插入租约费用项目（直接输入模式）
      if (data.fee_items && data.fee_items.length > 0) {
        // 获取费用类型详情（用于获取 category）
        const feeItemIds = data.fee_items.filter((i) => i.fee_type_id).map((i) => i.fee_type_id!);
        const apartmentFeeItems = feeItemIds.length > 0 ? await getApartmentFeeItemRepo().findByIds(feeItemIds) : [];
        const apartmentFeeItemMap = new Map(apartmentFeeItems.map((i) => [i.id, i]));

        const feeItemsData = data.fee_items.map((item) => {
          const apartmentFeeItem = item.fee_type_id ? apartmentFeeItemMap.get(item.fee_type_id) : null;
          return {
            id: ulid().toLowerCase(),
            lease_id: lease.id,
            fee_type_id: item.fee_type_id ?? null,
            fee_category: apartmentFeeItem?.category ?? 'fixed',
            fee_name: item.fee_name,
            fee_amount: item.fee_amount,
            fee_cycle: item.fee_cycle,
            quantity: item.quantity ?? 1,
            notes: item.notes ?? null,
          };
        });
        await getLeaseFeeItemRepo().createMany(feeItemsData);
      }

      // 自动创建首个账单（租金 + 押金 + 费用项目）
      try {
        const startDateObj = new Date(lease.start_date);
        const billYear = startDateObj.getFullYear();
        const billMonth = startDateObj.getMonth() + 1;
        const monthlyRent = Number(lease.monthly_rent);
        const depositAmt = Number(lease.deposit ?? 0);

        // 计算其他费用（直接使用输入的金额）
        let otherAmount = 0;
        if (data.fee_items && data.fee_items.length > 0) {
          for (const item of data.fee_items) {
            otherAmount += item.fee_amount * (item.quantity ?? 1);
          }
        }

        const billData: CreateBillInput = {
          lease_id: lease.id,
          bill_year: billYear,
          bill_month: billMonth,
          due_date: startDateObj.toISOString().slice(0, 10),
          rent_amount: monthlyRent,
          deposit_amount: depositAmt,
          other_amount: otherAmount,
          total_amount: monthlyRent + depositAmt + otherAmount,
        };
        await getBillSvc().create(orgId, billData);
      } catch (e) {
        logger.error({ err: e, leaseId: lease.id }, 'Failed to create initial bill for lease');
      }

      // 新租客入住通知（不影响主流程）
      try {
        const startDate = new Date(data.start_date).toISOString().slice(0, 10);
        await notifyOrgAdmins(
          orgId,
          'tenant_move_in',
          `新租客入住 - ${tenant.name}`,
          `租客 ${tenant.name} 已创建租约并入住（房间 ${room.room_number}），起租日期 ${startDate}。`,
          {
            category: 'tenant',
            target_path: '/leases',
            action_label: '查看租约',
            lease_id: lease.id,
            tenant_id: tenant.id,
            tenant_name: tenant.name,
            room_id: room.id,
            room_number: room.room_number,
            start_date: startDate,
          },
          getOrgRepo
        );
      } catch (e) {
        logger.error({ err: e, leaseId: lease.id }, 'Failed to create tenant_move_in notification');
      }

      return lease;
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

      // 租客退租通知（不影响主流程）
      try {
        const endDate = new Date().toISOString().slice(0, 10);
        await notifyOrgAdmins(
          orgId,
          'tenant_move_out',
          `租客退租 - ${existing.tenant.name}`,
          `租客 ${existing.tenant.name} 已办理退租（房间 ${existing.room.room_number}），办理日期 ${endDate}。`,
          {
            category: 'tenant',
            target_path: '/leases',
            action_label: '查看租约',
            lease_id: existing.id,
            tenant_id: existing.tenant_id,
            tenant_name: existing.tenant.name,
            room_id: existing.room_id,
            room_number: existing.room.room_number,
            end_date: endDate,
          },
          getOrgRepo
        );
      } catch (e) {
        logger.error({ err: e, leaseId: existing.id }, 'Failed to create tenant_move_out notification');
      }
    },

    delete: async (orgId: string, id: string) => {
      const existing = await getRepo().findByIdWithRelations(id);
      if (!existing || existing.room.apartment.organization_id !== orgId) {
        throw createAppError(404, NotFoundMessages.LEASE);
      }
      await getRepo().delete(id);
    },

    changeRoom: async (orgId: string, leaseId: string, newRoomId: string, changeDate: string, reason?: string) => {
      const lease = await getRepo().findByIdWithRelations(leaseId);
      if (!lease || lease.room.apartment.organization_id !== orgId) {
        throw createAppError(404, NotFoundMessages.LEASE);
      }

      const newRoom = await getRoomRepo().findByIdWithApartment(newRoomId);
      if (!newRoom || newRoom.apartment.organization_id !== orgId) {
        throw createAppError(404, '目标房间不存在');
      }
      // 房间可用性现在由 maintenance 标记和活跃租约决定
      // 检查房间是否处于维护状态
      if (newRoom.maintenance) {
        throw createAppError(400, '目标房间处于维护中，请选择其他房间');
      }

      const oldRoomId = lease.room_id;

      await prisma.$transaction(async (tx) => {
        // 不再直接设置 status，status 由 maintenance 和活跃租约自动计算
        await tx.lease.update({ where: { id: leaseId }, data: { room_id: newRoomId } });
        await tx.leaseChangeLog.create({
          data: {
            id: ulid().toLowerCase(),
            lease_id: leaseId,
            change_type: 'room_change',
            old_value: { room_id: oldRoomId },
            new_value: { room_id: newRoomId },
            reason,
          },
        });
      });

      return {
        lease_id: leaseId,
        old_room_id: oldRoomId,
        new_room_id: newRoomId,
        changed_at: changeDate,
      };
    },

    renew: async (orgId: string, leaseId: string, newEndDate: string, reason?: string) => {
      const lease = await getRepo().findByIdWithRelations(leaseId);
      if (!lease || lease.room.apartment.organization_id !== orgId) {
        throw createAppError(404, NotFoundMessages.LEASE);
      }

      const newEnd = new Date(newEndDate);
      const currentEnd = lease.end_date ? new Date(lease.end_date) : null;
      if (currentEnd && newEnd <= currentEnd) {
        throw createAppError(400, '续约日期必须晚于当前租约结束日期');
      }

      const oldEndDate = lease.end_date ? lease.end_date.toISOString().slice(0, 10) : null;

      await prisma.$transaction(async (tx) => {
        await tx.lease.update({ where: { id: leaseId }, data: { end_date: newEnd } });
        await tx.leaseChangeLog.create({
          data: {
            id: ulid().toLowerCase(),
            lease_id: leaseId,
            change_type: 'renew',
            old_value: { end_date: oldEndDate },
            new_value: { end_date: newEndDate },
            reason,
          },
        });
      });

      return {
        lease_id: leaseId,
        old_end_date: oldEndDate ?? '',
        new_end_date: newEndDate,
        renewed_at: new Date().toISOString(),
      };
    },

    updateTenant: async (orgId: string, leaseId: string, newTenantId: string) => {
      const lease = await getRepo().findByIdWithRelations(leaseId);
      if (!lease || lease.room.apartment.organization_id !== orgId) {
        throw createAppError(404, NotFoundMessages.LEASE);
      }

      const newTenant = await getTenantRepo().findByIdAndOrg(newTenantId, orgId);
      if (!newTenant) {
        throw createAppError(404, '租客不存在');
      }

      const oldTenantId = lease.tenant_id;

      await prisma.$transaction(async (tx) => {
        await tx.lease.update({ where: { id: leaseId }, data: { tenant_id: newTenantId } });
        await tx.leaseChangeLog.create({
          data: {
            id: ulid().toLowerCase(),
            lease_id: leaseId,
            change_type: 'update_tenant',
            old_value: { tenant_id: oldTenantId },
            new_value: { tenant_id: newTenantId },
          },
        });
      });

      return {
        lease_id: leaseId,
        old_tenant_id: oldTenantId,
        new_tenant_id: newTenantId,
        updated_at: new Date().toISOString(),
      };
    },

    changeRent: async (
      orgId: string,
      leaseId: string,
      newRent: number,
      effectiveFromYear: number,
      effectiveFromMonth: number,
      reason?: string
    ) => {
      const lease = await getRepo().findByIdWithRelations(leaseId);
      if (!lease || lease.room.apartment.organization_id !== orgId) {
        throw createAppError(404, NotFoundMessages.LEASE);
      }

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      if (
        effectiveFromYear < currentYear ||
        (effectiveFromYear === currentYear && effectiveFromMonth < currentMonth)
      ) {
        throw createAppError(400, '生效期不能早于当前账期');
      }

      const oldRent = Number(lease.monthly_rent);

      await getLeaseChangeLogRepo().create({
        id: ulid().toLowerCase(),
        lease: { connect: { id: leaseId } },
        change_type: 'rent_change',
        old_value: { monthly_rent: oldRent },
        new_value: { monthly_rent: newRent },
        effective_from_year: effectiveFromYear,
        effective_from_month: effectiveFromMonth,
        reason,
      });

      return {
        lease_id: leaseId,
        old_rent: oldRent,
        new_rent: newRent,
        effective_from: { year: effectiveFromYear, month: effectiveFromMonth },
      };
    },

    changeUtilityRates: async (
      orgId: string,
      leaseId: string,
      waterRate: number,
      electricityRate: number,
      effectiveFromYear: number,
      effectiveFromMonth: number
    ) => {
      const lease = await getRepo().findByIdWithRelations(leaseId);
      if (!lease || lease.room.apartment.organization_id !== orgId) {
        throw createAppError(404, NotFoundMessages.LEASE);
      }

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      if (
        effectiveFromYear < currentYear ||
        (effectiveFromYear === currentYear && effectiveFromMonth < currentMonth)
      ) {
        throw createAppError(400, '生效期不能早于当前账期');
      }

      const oldWater = Number(lease.water_rate);
      const oldElec = Number(lease.electricity_rate);

      await getLeaseChangeLogRepo().create({
        id: ulid().toLowerCase(),
        lease: { connect: { id: leaseId } },
        change_type: 'utility_rate_change',
        old_value: { water_rate: oldWater, electricity_rate: oldElec },
        new_value: { water_rate: waterRate, electricity_rate: electricityRate },
        effective_from_year: effectiveFromYear,
        effective_from_month: effectiveFromMonth,
      });

      return {
        lease_id: leaseId,
        old_rates: { water: oldWater, electricity: oldElec },
        new_rates: { water: waterRate, electricity: electricityRate },
        effective_from: { year: effectiveFromYear, month: effectiveFromMonth },
      };
    },

    changeDeposit: async (orgId: string, leaseId: string, newDeposit: number, reason?: string) => {
      const lease = await getRepo().findByIdWithRelations(leaseId);
      if (!lease || lease.room.apartment.organization_id !== orgId) {
        throw createAppError(404, NotFoundMessages.LEASE);
      }

      const oldDeposit = Number(lease.deposit);
      const difference = newDeposit - oldDeposit;

      let billId = '';

      await prisma.$transaction(async (tx) => {
        await tx.lease.update({ where: { id: leaseId }, data: { deposit: newDeposit } });

        const bill = await tx.bill.create({
          data: {
            id: ulid().toLowerCase(),
            lease_id: leaseId,
            bill_year: new Date().getFullYear(),
            bill_month: new Date().getMonth() + 1,
            due_date: new Date(),
            rent_amount: 0,
            deposit_amount: difference,
            water_amount: 0,
            electricity_amount: 0,
            other_amount: 0,
            total_amount: difference,
            paid_amount: 0,
            status: 'pending',
          },
        });
        billId = bill.id;

        await tx.leaseChangeLog.create({
          data: {
            id: ulid().toLowerCase(),
            lease_id: leaseId,
            change_type: 'deposit_change',
            old_value: { deposit: oldDeposit },
            new_value: { deposit: newDeposit },
            reason,
          },
        });
      });

      return {
        lease_id: leaseId,
        old_deposit: oldDeposit,
        new_deposit: newDeposit,
        difference,
        bill_id: billId,
        bill_status: 'pending',
      };
    },

    updateFeeItems: async (
      orgId: string,
      leaseId: string,
      feeItems: Array<{ fee_type_id: string; quantity: number }>,
      effectiveFromYear: number,
      effectiveFromMonth: number
    ) => {
      const lease = await getRepo().findByIdWithRelations(leaseId);
      if (!lease || lease.room.apartment.organization_id !== orgId) {
        throw createAppError(404, NotFoundMessages.LEASE);
      }

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      if (
        effectiveFromYear < currentYear ||
        (effectiveFromYear === currentYear && effectiveFromMonth < currentMonth)
      ) {
        throw createAppError(400, '生效期不能早于当前账期');
      }

      const apartmentId = lease.room.apartment_id;

      const enabledItems = await getApartmentFeeItemRepo().findByApartmentId(apartmentId, {
        isActive: true,
      });
      const enabledFeeItemIds = new Set(enabledItems.map((item) => item.id));

      for (const item of feeItems) {
        if (!enabledFeeItemIds.has(item.fee_type_id)) {
          throw createAppError(400, `费用项目 ${item.fee_type_id} 未在公寓中启用`);
        }
      }

      await getLeaseChangeLogRepo().create({
        id: ulid().toLowerCase(),
        lease: { connect: { id: leaseId } },
        change_type: 'fee_items_update',
        old_value: undefined,
        new_value: { fee_items: feeItems } as Prisma.InputJsonValue,
        effective_from_year: effectiveFromYear,
        effective_from_month: effectiveFromMonth,
      });

      return {
        lease_id: leaseId,
        updated_at: new Date().toISOString(),
      };
    },

    setLeaseFeeItems: async (
      orgId: string,
      leaseId: string,
      feeItems: Array<{
        fee_type_id?: string;
        fee_name: string;
        fee_amount: number;
        fee_cycle: 'monthly' | 'quarterly' | 'yearly' | 'one_time';
        quantity?: number;
        notes?: string;
      }>
    ) => {
      const lease = await getRepo().findByIdWithRelations(leaseId);
      if (!lease || lease.room.apartment.organization_id !== orgId) {
        throw createAppError(404, NotFoundMessages.LEASE);
      }

      // 获取旧的费用项目（用于变更记录）
      const oldFeeItems = await getLeaseFeeItemRepo().findByLeaseId(leaseId);

      // 删除旧的费用项目
      await getLeaseFeeItemRepo().deleteByLeaseId(leaseId);

      // 获取费用类型详情
      const feeItemIds = feeItems.filter((i) => i.fee_type_id).map((i) => i.fee_type_id!);
      const apartmentFeeItems = feeItemIds.length > 0 ? await getApartmentFeeItemRepo().findByIds(feeItemIds) : [];
      const apartmentFeeItemMap = new Map(apartmentFeeItems.map((i) => [i.id, i]));

      // 创建新的费用项目
      const itemsToCreate = feeItems.map((item) => {
        const apartmentFeeItem = item.fee_type_id ? apartmentFeeItemMap.get(item.fee_type_id) : null;
        return {
          id: ulid().toLowerCase(),
          lease_id: leaseId,
          fee_type_id: item.fee_type_id ?? null,
          fee_category: apartmentFeeItem?.category ?? 'fixed',
          fee_name: item.fee_name,
          fee_amount: item.fee_amount,
          fee_cycle: item.fee_cycle,
          quantity: item.quantity ?? 1,
          notes: item.notes ?? null,
        };
      });
      await getLeaseFeeItemRepo().createMany(itemsToCreate);

      // 记录变更日志
      const oldItemsFormatted = oldFeeItems.map((item) => ({
        fee_name: item.fee_name,
        fee_amount: Number(item.fee_amount),
        fee_cycle: item.fee_cycle,
        notes: item.notes || '',
      }));
      const newItemsFormatted = feeItems.map((item) => ({
        fee_name: item.fee_name,
        fee_amount: item.fee_amount,
        fee_cycle: item.fee_cycle,
        notes: item.notes || '',
      }));

      await getLeaseChangeLogRepo().create({
        id: ulid().toLowerCase(),
        lease: { connect: { id: leaseId } },
        change_type: 'fee_items_update',
        old_value: { fee_items: oldItemsFormatted } as Prisma.InputJsonValue,
        new_value: { fee_items: newItemsFormatted } as Prisma.InputJsonValue,
      });

      return {
        lease_id: leaseId,
        updated_at: new Date().toISOString(),
      };
    },
  };
}

/**
 * 默认 Lease Service 实例
 */
export const defaultLeaseService = createLeaseService();
