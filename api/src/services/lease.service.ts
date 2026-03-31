import type { Lease, Prisma } from '@prisma/client';
import { ulid } from 'ulid';
import {
  createLeaseRepository,
  type LeaseRepository,
  type LeaseWithRelations,
} from '../repositories/lease.repo.js';
import { createAppError } from '../utils/appError.js';
import { NotFoundMessages } from '../messages.js';
import { logger } from '../utils/logger.js';
import { prisma } from '../lib/prisma.js';
import { defaultBillService, type CreateBillInput } from './bill.service.js';
import {
  compareBooleanDesc,
  compareDateDesc,
  compareNaturalText,
} from '../utils/intuitiveSort.js';

/**
 * 租约费用项目输入
 */
export interface LeaseFeeItemInput {
  fee_type_id: string;
  specification_id?: string;
  quantity?: number;
  billing_cycle?: 'monthly' | 'yearly';
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
    feeItems: Array<{ fee_type_id: string; specification_id?: string; quantity: number }>,
    effectiveFromYear: number,
    effectiveFromMonth: number
  ): Promise<{ lease_id: string; updated_at: string }>;
  setLeaseFeeItems(
    orgId: string,
    leaseId: string,
    feeItems: Array<{
      fee_type_id?: string;
      fee_name: string;
      fee_code?: string;
      specification_id?: string;
      spec_name?: string;
      spec_unit_price: number;
      quantity: number;
      billing_cycle?: 'monthly' | 'yearly';
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
  extraData: Prisma.InputJsonObject
): Promise<void> {
  const members = await prisma.organizationMember.findMany({
    where: { organization_id: orgId, role: { in: ['owner', 'admin'] } },
    select: { user_id: true },
  });

  for (const member of members) {
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
  getRepo: () => LeaseRepository = () => createLeaseRepository(prisma)
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
      const lease = await getRepo().createWithRoomUpdate(buildCreateData(data), data.room_id);

      // 插入租约费用项目（包含快照数据）
      if (data.fee_items && data.fee_items.length > 0) {
        // 获取费用类型和规格信息用于快照
        const feeTypeIds = data.fee_items.map((i) => i.fee_type_id).filter(Boolean) as string[];
        const specIds = data.fee_items.map((i) => i.specification_id).filter(Boolean) as string[];

        const [feeTypes, specs] = await Promise.all([
          feeTypeIds.length > 0 ? prisma.feeType.findMany({ where: { id: { in: feeTypeIds } } }) : [],
          specIds.length > 0 ? prisma.feeSpecification.findMany({ where: { id: { in: specIds } } }) : [],
        ]);

        const feeTypeMap = new Map(feeTypes.map((ft) => [ft.id, ft]));
        const specMap = new Map(specs.map((s) => [s.id, s]));

        const feeItemsData = data.fee_items.map((item) => {
          const feeType = feeTypeMap.get(item.fee_type_id);
          const spec = item.specification_id ? specMap.get(item.specification_id) : null;
          return {
            id: ulid().toLowerCase(),
            lease_id: lease.id,
            fee_type_id: item.fee_type_id,
            fee_name: feeType?.name || '',
            fee_code: feeType?.code,
            specification_id: item.specification_id,
            spec_name: spec?.name,
            spec_unit_price: spec ? Number(spec.price_monthly) : 0,
            quantity: item.quantity ?? 1,
            billing_cycle: item.billing_cycle ?? 'monthly',
          };
        });
        await prisma.leaseFeeItem.createMany({ data: feeItemsData as any });
      }

      // 自动创建首个账单（租金 + 押金 + 费用项目）
      try {
        const startDateObj = new Date(lease.start_date);
        const billYear = startDateObj.getFullYear();
        const billMonth = startDateObj.getMonth() + 1;
        const monthlyRent = Number(lease.monthly_rent);
        const depositAmt = Number(lease.deposit ?? 0);

        // 查询费用项目计算其他费用
        let otherAmount = 0;
        if (data.fee_items && data.fee_items.length > 0) {
          const feeSpecs = await prisma.feeSpecification.findMany({
            where: { id: { in: data.fee_items.filter((i) => i.specification_id).map((i) => i.specification_id!) } },
          });
          const specMap = new Map(feeSpecs.map((s) => [s.id, s]));
          for (const item of data.fee_items) {
            const spec = item.specification_id ? specMap.get(item.specification_id) : null;
            if (spec) {
              otherAmount += Number(spec.price_monthly) * (item.quantity ?? 1);
            }
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
        await defaultBillService.create(orgId, billData);
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
          }
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
          }
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

      const roomId = existing.room_id;

      await prisma.$transaction(async (tx) => {
        // 删除租约
        await tx.lease.delete({ where: { id } });

        // 检查该房间是否还有其他活跃租约
        const otherActiveLeases = await tx.lease.count({
          where: { room_id: roomId, is_active: true, id: { not: id } },
        });

        // 如果没有其他活跃租约，释放房间
        if (otherActiveLeases === 0) {
          await tx.room.update({
            where: { id: roomId },
            data: { status: 'available' },
          });
        }
      });
    },

    changeRoom: async (orgId: string, leaseId: string, newRoomId: string, changeDate: string, reason?: string) => {
      const lease = await getRepo().findByIdWithRelations(leaseId);
      if (!lease || lease.room.apartment.organization_id !== orgId) {
        throw createAppError(404, NotFoundMessages.LEASE);
      }

      const newRoom = await prisma.room.findFirst({
        where: { id: newRoomId },
        include: { apartment: true },
      });
      if (!newRoom || newRoom.apartment.organization_id !== orgId) {
        throw createAppError(404, '目标房间不存在');
      }
      if (newRoom.status !== 'available') {
        throw createAppError(400, '目标房间不可用，请选择其他房间');
      }

      const oldRoomId = lease.room_id;

      await prisma.$transaction(async (tx) => {
        await tx.room.update({ where: { id: newRoomId }, data: { status: 'occupied' } });
        await tx.room.update({ where: { id: oldRoomId }, data: { status: 'available' } });
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

      const newTenant = await prisma.tenant.findFirst({
        where: { id: newTenantId, organization_id: orgId },
      });
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

      await prisma.leaseChangeLog.create({
        data: {
          id: ulid().toLowerCase(),
          lease_id: leaseId,
          change_type: 'rent_change',
          old_value: { monthly_rent: oldRent },
          new_value: { monthly_rent: newRent },
          effective_from_year: effectiveFromYear,
          effective_from_month: effectiveFromMonth,
          reason,
        },
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

      await prisma.leaseChangeLog.create({
        data: {
          id: ulid().toLowerCase(),
          lease_id: leaseId,
          change_type: 'utility_rate_change',
          old_value: { water_rate: oldWater, electricity_rate: oldElec },
          new_value: { water_rate: waterRate, electricity_rate: electricityRate },
          effective_from_year: effectiveFromYear,
          effective_from_month: effectiveFromMonth,
        },
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
      feeItems: Array<{ fee_type_id: string; specification_id?: string; quantity: number }>,
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

      // 获取旧费用项目（包含名称）
      const oldFeeItems = lease.fee_items.map((item) => ({
        fee_type_id: item.fee_type_id,
        fee_type_name: item.feeType?.name || item.fee_type_id,
        specification_id: item.specification_id,
        specification_name: item.specification?.name,
        quantity: Number(item.quantity),
      }));

      // 获取新费用项目的名称
      const feeTypeIds = [...new Set(feeItems.map((item) => item.fee_type_id))];
      const feeTypesData = await prisma.feeType.findMany({
        where: { id: { in: feeTypeIds } },
        include: { specifications: true },
      });
      const feeTypeMap = new Map(feeTypesData.map((ft) => [ft.id, ft]));
      const specMap = new Map(feeTypesData.flatMap((ft) => ft.specifications.map((s) => [s.id, s])));

      const newFeeItems = feeItems.map((item) => ({
        fee_type_id: item.fee_type_id,
        fee_type_name: feeTypeMap.get(item.fee_type_id)?.name || item.fee_type_id,
        specification_id: item.specification_id,
        specification_name: item.specification_id ? specMap.get(item.specification_id)?.name : undefined,
        quantity: item.quantity,
      }));

      await prisma.leaseChangeLog.create({
        data: {
          id: ulid().toLowerCase(),
          lease_id: leaseId,
          change_type: 'fee_items_update',
          old_value: { fee_items: oldFeeItems } as Prisma.InputJsonValue,
          new_value: { fee_items: newFeeItems } as Prisma.InputJsonValue,
          effective_from_year: effectiveFromYear,
          effective_from_month: effectiveFromMonth,
        },
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
        fee_code?: string;
        specification_id?: string;
        spec_name?: string;
        spec_unit_price: number;
        quantity: number;
        billing_cycle?: 'monthly' | 'yearly';
      }>
    ) => {
      const lease = await getRepo().findByIdWithRelations(leaseId);
      if (!lease || lease.room.apartment.organization_id !== orgId) {
        throw createAppError(404, NotFoundMessages.LEASE);
      }

      // 删除旧的费用项目
      await prisma.leaseFeeItem.deleteMany({
        where: { lease_id: leaseId },
      });

      // 创建新的费用项目
      if (feeItems.length > 0) {
        const data = feeItems.map((item) => {
          const obj: Record<string, unknown> = {
            id: ulid().toLowerCase(),
            lease_id: leaseId,
            fee_name: item.fee_name,
            spec_unit_price: item.spec_unit_price,
            quantity: item.quantity,
            billing_cycle: item.billing_cycle ?? 'monthly',
          };
          if (item.fee_type_id) obj.fee_type_id = item.fee_type_id;
          if (item.fee_code) obj.fee_code = item.fee_code;
          if (item.specification_id) obj.specification_id = item.specification_id;
          if (item.spec_name) obj.spec_name = item.spec_name;
          return obj;
        });
        await prisma.leaseFeeItem.createMany({ data: data as any });
      }

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
