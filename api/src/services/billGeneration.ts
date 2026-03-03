import { ulid } from 'ulid';
import { prisma } from '../lib/prisma.js';

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
            : (config?.water_price_per_unit != null ? Number(config.water_price_per_unit) : 0);
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
            : (config?.electricity_price_per_unit != null ? Number(config.electricity_price_per_unit) : 0);
        electricityAmount = usage * rate;
      }
    }
    let otherAmount = 0;
    if (config) {
      if (config.internet_fee != null) otherAmount += Number(config.internet_fee);
      if (config.management_fee != null) otherAmount += Number(config.management_fee);
      if (config.service_fee != null) otherAmount += Number(config.service_fee);
    }
    const totalAmount = rentAmount + waterAmount + electricityAmount + otherAmount;

    await prisma.bill.create({
      data: {
        id: ulid().toLowerCase(),
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
    created += 1;
  }

  return { created, skipped };
}
