import { ulid } from 'ulid';
import { prisma } from '../lib/prisma.js';
import { createAppError } from '../utils/appError.js';
import { createLeaseRepository, type LeaseRepository } from '../repositories/lease.repo.js';
import { createUtilityRepository, type UtilityRepository } from '../repositories/utility.repo.js';
import { createLeaseFeeItemRepository, type LeaseFeeItemRepository } from '../repositories/leaseFeeItem.repo.js';

export interface SettleLeaseInput {
  lease_id: string;
  org_id: string;
  final_water_reading?: number;
  final_electricity_reading?: number;
  penalty_amount?: number;
  remarks?: string;
}

export interface SettleLeaseResult {
  lease_id: string;
  settlement_bill_id: string;
  final_rent: number;
  final_water: number;
  final_electricity: number;
  final_other: number;
  deposit_refund: number;
  deposit_forfeited: number;
  penalty_amount: number;
  total_amount: number;
  paid_amount: number;
  refund_amount: number;
  settled_at: string;
}

export async function settleLease(
  input: SettleLeaseInput,
  getLeaseRepo: () => LeaseRepository = () => createLeaseRepository(prisma),
  getUtilityRepo: () => UtilityRepository = () => createUtilityRepository(prisma),
  getLeaseFeeItemRepo: () => LeaseFeeItemRepository = () => createLeaseFeeItemRepository(prisma)
): Promise<SettleLeaseResult> {
  const { lease_id, org_id, final_water_reading, final_electricity_reading, penalty_amount = 0, remarks } = input;

  const lease = await getLeaseRepo().findByIdWithRelations(lease_id);
  if (!lease || lease.room.apartment.organization_id !== org_id) {
    throw createAppError(404, '租约不存在');
  }
  if (!lease.is_active) {
    throw createAppError(400, '租约已退租');
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const existingReading = await getUtilityRepo().findExistingReading(
    lease.room_id,
    currentYear,
    currentMonth
  );

  const waterReading = final_water_reading ?? existingReading?.water_reading;
  const electricityReading = final_electricity_reading ?? existingReading?.electricity_reading;

  if (waterReading === null || waterReading === undefined) {
    throw createAppError(400, '请提供本月水表读数');
  }
  if (electricityReading === null || electricityReading === undefined) {
    throw createAppError(400, '请提供本月电表读数');
  }

  const previousWater = existingReading?.water_previous ?? existingReading?.water_reading ?? 0;
  const previousElec = existingReading?.electricity_previous ?? existingReading?.electricity_reading ?? 0;

  const waterUsed = Number(waterReading) - Number(previousWater);
  const elecUsed = Number(electricityReading) - Number(previousElec);
  const waterAmount = waterUsed * Number(lease.water_rate);
  const elecAmount = elecUsed * Number(lease.electricity_rate);

  const monthlyRent = Number(lease.monthly_rent);

  const leaseFeeItems = await getLeaseFeeItemRepo().findByLeaseId(lease_id);
  let otherAmount = 0;
  for (const item of leaseFeeItems) {
    otherAmount += Number(item.fee_amount) * Number(item.quantity);
  }

  const depositAmount = Number(lease.deposit);
  const totalPayable = monthlyRent + waterAmount + elecAmount + otherAmount + penalty_amount;
  const depositRefund = Math.max(0, depositAmount - penalty_amount);

  let settlementBillId = '';
  let settlementBillTotal = 0;
  let paidAmount = 0;

  await prisma.$transaction(async (tx) => {
    if (!existingReading) {
      await tx.utilityReading.create({
        data: {
          id: ulid().toLowerCase(),
          room_id: lease.room_id,
          period_year: currentYear,
          period_month: currentMonth,
          reading_date: now,
          water_reading: waterReading,
          electricity_reading: electricityReading,
          water_previous: previousWater,
          electricity_previous: previousElec,
        },
      });
    }

    const settlementBill = await tx.bill.create({
      data: {
        id: ulid().toLowerCase(),
        lease_id,
        bill_year: currentYear,
        bill_month: currentMonth,
        due_date: now,
        rent_amount: monthlyRent,
        deposit_amount: 0,
        water_amount: waterAmount,
        electricity_amount: elecAmount,
        other_amount: otherAmount,
        total_amount: totalPayable,
        paid_amount: 0,
        status: totalPayable <= depositRefund ? 'paid' : 'pending',
        notes: `退租结算${remarks ? ` - ${remarks}` : ''}`,
      },
    });
    settlementBillId = settlementBill.id;
    settlementBillTotal = totalPayable;
    paidAmount = totalPayable <= depositRefund ? totalPayable : 0;

    if (totalPayable <= depositRefund) {
      await tx.bill.update({
        where: { id: settlementBillId },
        data: { paid_amount: totalPayable, status: 'paid' },
      });
    }

    await tx.lease.update({
      where: { id: lease_id },
      data: { is_active: false },
    });

    await tx.room.update({
      where: { id: lease.room_id },
      data: { status: 'available' },
    });

    await tx.leaseChangeLog.create({
      data: {
        id: ulid().toLowerCase(),
        lease_id,
        change_type: 'settle',
        old_value: {
          deposit: depositAmount,
          status: 'active',
        },
        new_value: {
          deposit_refund: depositRefund,
          deposit_forfeited: penalty_amount,
          final_rent: monthlyRent,
          final_water: waterAmount,
          final_electricity: elecAmount,
          final_other: otherAmount,
          penalty_amount,
        },
        reason: remarks,
      },
    });
  });

  return {
    lease_id,
    settlement_bill_id: settlementBillId,
    final_rent: monthlyRent,
    final_water: waterAmount,
    final_electricity: elecAmount,
    final_other: otherAmount,
    deposit_refund: depositRefund,
    deposit_forfeited: penalty_amount,
    penalty_amount,
    total_amount: settlementBillTotal,
    paid_amount: paidAmount,
    refund_amount: depositRefund - paidAmount,
    settled_at: now.toISOString(),
  };
}
