import { ulid } from 'ulid';
import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';
import { defaultTenantReachabilityService } from './tenantReachability.service.js';

/**
 * 查询某租约在指定账期的生效值（考虑变更日志中的未来生效变更）
 */
async function getEffectiveLeaseValues(
  leaseId: string,
  billYear: number,
  billMonth: number
): Promise<{
  monthly_rent: number;
  water_rate: number;
  electricity_rate: number;
}> {
  const lease = await prisma.lease.findUnique({
    where: { id: leaseId },
    select: { monthly_rent: true, water_rate: true, electricity_rate: true },
  });

  if (!lease) {
    throw new Error(`Lease ${leaseId} not found`);
  }

  let effectiveRent = Number(lease.monthly_rent);
  let effectiveWater = Number(lease.water_rate);
  let effectiveElec = Number(lease.electricity_rate);

  // 查询生效的变更日志
  const changes = await prisma.leaseChangeLog.findMany({
    where: {
      lease_id: leaseId,
      effective_from_year: { lte: billYear },
      effective_from_month: { lte: billMonth },
      change_type: { in: ['rent_change', 'utility_rate_change'] },
    },
    orderBy: { created_at: 'asc' },
  });

  // 取最新生效的变更
  const latestRentChange = changes
    .filter((c) => c.change_type === 'rent_change')
    .sort((a, b) => {
      if (a.effective_from_year !== b.effective_from_year) {
        return b.effective_from_year! - a.effective_from_year!;
      }
      return b.effective_from_month! - a.effective_from_month!;
    })[0];

  const latestUtilChange = changes
    .filter((c) => c.change_type === 'utility_rate_change')
    .sort((a, b) => {
      if (a.effective_from_year !== b.effective_from_year) {
        return b.effective_from_year! - a.effective_from_year!;
      }
      return b.effective_from_month! - a.effective_from_month!;
    })[0];

  if (latestRentChange?.new_value) {
    const nv = latestRentChange.new_value as Record<string, unknown>;
    if (nv.monthly_rent !== undefined) {
      effectiveRent = Number(nv.monthly_rent);
    }
  }

  if (latestUtilChange?.new_value) {
    const nv = latestUtilChange.new_value as Record<string, unknown>;
    if (nv.water_rate !== undefined) {
      effectiveWater = Number(nv.water_rate);
    }
    if (nv.electricity_rate !== undefined) {
      effectiveElec = Number(nv.electricity_rate);
    }
  }

  return {
    monthly_rent: effectiveRent,
    water_rate: effectiveWater,
    electricity_rate: effectiveElec,
  };
}

/**
 * 为指定组织生成指定周期的账单，与 POST /bills/generate 逻辑一致。
 */
export async function generateBillsForOrg(
  orgId: string,
  billYear: number,
  billMonth: number,
  dueDate: Date,
  leaseIds?: string[]
): Promise<{ created: number; skipped: number }> {
  const rooms = await prisma.room.findMany({
    where: { apartment: { organization_id: orgId } },
    select: { id: true },
  });
  const roomIds = rooms.map((r) => r.id);
  let leases = await prisma.lease.findMany({
    where: {
      room_id: { in: roomIds },
      is_active: true,
      room: { status: 'occupied' },
    },
    include: { room: { include: { apartment: true } } },
  });
  if (leaseIds?.length) leases = leases.filter((l) => leaseIds.includes(l.id));

  let created = 0;
  let skipped = 0;

  for (const lease of leases) {
    const existing = await prisma.bill.findFirst({
      where: { lease_id: lease.id, bill_year: billYear, bill_month: billMonth },
    });
    if (existing) {
      skipped += 1;
      continue;
    }

    const reading = await prisma.utilityReading.findFirst({
      where: { room_id: lease.room_id, period_year: billYear, period_month: billMonth },
    });
    const config = await prisma.utilityConfig.findUnique({
      where: { apartment_id: lease.room.apartment_id },
    });

    // 获取生效中的租约值（考虑未来生效的变更）
    const effective = await getEffectiveLeaseValues(lease.id, billYear, billMonth);

    const rentAmount = effective.monthly_rent;
    let waterAmount = 0;
    if (reading?.water_reading != null && reading?.water_previous != null) {
      const usage = Number(reading.water_reading) - Number(reading.water_previous);
      if (usage > 0) {
        const rate =
          effective.water_rate > 0
            ? effective.water_rate
            : config?.water_price_per_unit != null
              ? Number(config.water_price_per_unit)
              : 0;
        waterAmount = usage * rate;
      }
    }
    let electricityAmount = 0;
    if (reading?.electricity_reading != null && reading?.electricity_previous != null) {
      const usage = Number(reading.electricity_reading) - Number(reading.electricity_previous);
      if (usage > 0) {
        const rate =
          effective.electricity_rate > 0
            ? effective.electricity_rate
            : config?.electricity_price_per_unit != null
              ? Number(config.electricity_price_per_unit)
              : 0;
        electricityAmount = usage * rate;
      }
    }

    // 查询组织启用的费用项目
    const feeItems = await prisma.orgFeeItem.findMany({
      where: {
        organization_id: lease.room.apartment.organization_id,
        is_active: true,
      },
    });

    // 计算费用明细
    const feeItemsData: Array<{
      id: string;
      fee_type_id: string;
      fee_category: string;
      fee_name: string;
      fee_amount: number;
      fee_cycle: string;
      quantity: number;
      unit_price: number;
      amount: number;
    }> = [];

    let otherAmount = 0;

    for (const orgFeeItem of feeItems) {
      const price = Number(orgFeeItem.amount);

      const feeItem = {
        id: ulid().toLowerCase(),
        fee_type_id: orgFeeItem.id,
        fee_category: orgFeeItem.category,
        fee_name: orgFeeItem.name,
        fee_amount: price,
        fee_cycle: orgFeeItem.cycle,
        quantity: 1,
        unit_price: price,
        amount: price,
      };

      feeItemsData.push(feeItem);
      otherAmount += price;
    }

    // 向后兼容：如果没有新的费用配置，使用旧的 UtilityConfig
    if (feeItems.length === 0 && config) {
      if (config.internet_fee != null) otherAmount += Number(config.internet_fee);
      if (config.management_fee != null) otherAmount += Number(config.management_fee);
      if (config.service_fee != null) otherAmount += Number(config.service_fee);
    }

    const totalAmount = rentAmount + waterAmount + electricityAmount + otherAmount;

    const billId = ulid().toLowerCase();

    // 使用事务创建账单和费用明细
    await prisma.$transaction(async (tx) => {
      await tx.bill.create({
        data: {
          id: billId,
          lease_id: lease.id,
          bill_year: billYear,
          bill_month: billMonth,
          due_date: dueDate,
          rent_amount: rentAmount,
          water_amount: waterAmount,
          electricity_amount: electricityAmount,
          other_amount: otherAmount,
          total_amount: totalAmount,
          paid_amount: 0,
          status: 'pending',
        },
      });

      // 创建费用明细
      if (feeItemsData.length > 0) {
        await tx.billFeeItem.createMany({
          data: feeItemsData.map((item) => ({
            id: item.id,
            bill_id: billId,
            fee_type_id: item.fee_type_id,
            fee_category: item.fee_category,
            fee_name: item.fee_name,
            fee_amount: item.fee_amount,
            fee_cycle: item.fee_cycle,
            quantity: item.quantity,
            unit_price: item.unit_price,
            amount: item.amount,
          })),
        });
      }
    });

    try {
      await defaultTenantReachabilityService.sendBillGenerated(billId);
    } catch (error) {
      logger.error({ err: error, billId }, 'failed to send tenant bill_generated sms');
    }

    created += 1;
  }

  return { created, skipped };
}
