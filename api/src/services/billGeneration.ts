import { ulid } from 'ulid';
import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';
import { defaultTenantReachabilityService } from './tenantReachability.service.js';

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

    const rentAmount = Number(lease.monthly_rent);
    let waterAmount = 0;
    if (reading?.water_reading != null && reading?.water_previous != null) {
      const usage = Number(reading.water_reading) - Number(reading.water_previous);
      if (usage > 0) {
        const rate =
          lease.water_rate != null
            ? Number(lease.water_rate)
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
          lease.electricity_rate != null
            ? Number(lease.electricity_rate)
            : config?.electricity_price_per_unit != null
              ? Number(config.electricity_price_per_unit)
              : 0;
        electricityAmount = usage * rate;
      }
    }

    // 查询公寓启用的费用配置
    const currentDate = new Date();
    const feeConfigs = await prisma.apartmentFeeConfig.findMany({
      where: {
        apartment_id: lease.room.apartment_id,
        is_enabled: true,
        effective_from: { lte: currentDate },
        OR: [{ effective_to: null }, { effective_to: { gte: currentDate } }],
      },
      include: {
        feeType: true,
        specification: true,
      },
    });

    // 计算费用明细
    const isYearly = lease.rental_type === 'yearly';
    const feeItemsData: Array<{
      id: string;
      fee_type_id: string;
      specification_id: string | null;
      fee_name: string;
      specification_name: string | null;
      quantity: number;
      unit_price: number;
      amount: number;
    }> = [];

    let otherAmount = 0;

    for (const feeConfig of feeConfigs) {
      const spec = feeConfig.specification;
      const price = isYearly && spec?.price_yearly != null
        ? Number(spec.price_yearly) / 12
        : spec?.price_monthly != null
          ? Number(spec.price_monthly)
          : 0;

      const feeItem = {
        id: ulid().toLowerCase(),
        fee_type_id: feeConfig.fee_type_id,
        specification_id: feeConfig.specification_id,
        fee_name: feeConfig.feeType.name,
        specification_name: spec?.name ?? null,
        quantity: 1,
        unit_price: price,
        amount: price,
      };

      feeItemsData.push(feeItem);
      otherAmount += price;
    }

    // 向后兼容：如果没有新的费用配置，使用旧的 UtilityConfig
    if (feeConfigs.length === 0 && config) {
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
            specification_id: item.specification_id,
            fee_name: item.fee_name,
            specification_name: item.specification_name,
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
