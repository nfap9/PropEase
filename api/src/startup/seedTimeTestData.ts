/**
 * 水电录入、账单出账功能的测试数据 seed
 * 依赖 E2E 用户（SEED_E2E_USER=true），在 e2e-personal 组织下创建固定时间数据
 *
 * 启用：SEED_TIME_TEST_DATA=true
 *
 * 数据说明：
 * - 公寓「测试公寓-水电出账」，2 房间 101、102
 * - 租约 2025-01-01 起租（可出 2025-01 账单）
 * - 101：有 2025-01 水电读数（可测出账含水电费）
 * - 102：无初始读数（可测水电录入、rooms-missing-initial、导出待录入）
 */
import { ulid } from 'ulid';
import { prisma } from '../lib/prisma.js';

const E2E_ORG_SLUG = 'e2e-personal';
const APARTMENT_NAME = '测试公寓-水电出账';
const LEASE_START = new Date('2025-01-01');
const LEASE_END = new Date('2025-12-31');

export async function seedTimeTestData(): Promise<void> {
  const org = await prisma.organization.findUnique({
    where: { slug: E2E_ORG_SLUG },
    select: { id: true },
  });
  if (!org) {
    console.log('Time test seed skipped: e2e-personal org not found, run with SEED_E2E_USER=true first');
    return;
  }

  const existing = await prisma.apartment.findFirst({
    where: { organization_id: org.id, name: APARTMENT_NAME },
    select: { id: true },
  });
  if (existing) {
    console.log('Time test seed skipped: data already exists');
    return;
  }

  const aptId = ulid().toLowerCase();
  const room101Id = ulid().toLowerCase();
  const room102Id = ulid().toLowerCase();
  const tenant101Id = ulid().toLowerCase();
  const tenant102Id = ulid().toLowerCase();
  const lease101Id = ulid().toLowerCase();
  const lease102Id = ulid().toLowerCase();
  const utilConfigId = ulid().toLowerCase();
  const reading101Id = ulid().toLowerCase();

  await prisma.$transaction([
    prisma.apartment.create({
      data: {
        id: aptId,
        organization_id: org.id,
        name: APARTMENT_NAME,
        address: '测试地址-水电出账',
      },
    }),
    prisma.room.createMany({
      data: [
        { id: room101Id, apartment_id: aptId, room_number: '101', status: 'occupied', monthly_rent: 1500 },
        { id: room102Id, apartment_id: aptId, room_number: '102', status: 'occupied', monthly_rent: 1600 },
      ],
    }),
    prisma.tenant.createMany({
      data: [
        { id: tenant101Id, organization_id: org.id, name: '测试租客-101', phone: '13900000101' },
        { id: tenant102Id, organization_id: org.id, name: '测试租客-102', phone: '13900000102' },
      ],
    }),
    prisma.lease.createMany({
      data: [
        {
          id: lease101Id,
          room_id: room101Id,
          tenant_id: tenant101Id,
          start_date: LEASE_START,
          end_date: LEASE_END,
          monthly_rent: 1500,
          water_rate: 5,
          electricity_rate: 0.6,
          is_active: true,
        },
        {
          id: lease102Id,
          room_id: room102Id,
          tenant_id: tenant102Id,
          start_date: LEASE_START,
          end_date: LEASE_END,
          monthly_rent: 1600,
          water_rate: 5,
          electricity_rate: 0.6,
          is_active: true,
        },
      ],
    }),
    prisma.utilityConfig.create({
      data: {
        id: utilConfigId,
        apartment_id: aptId,
        water_price_per_unit: 5,
        electricity_price_per_unit: 0.6,
        internet_fee: 30,
        management_fee: 50,
        effective_from: new Date('2024-01-01'),
      },
    }),
    prisma.utilityReading.create({
      data: {
        id: reading101Id,
        room_id: room101Id,
        period_year: 2025,
        period_month: 1,
        reading_date: new Date('2025-01-05'),
        water_previous: 10,
        water_reading: 15,
        electricity_previous: 100,
        electricity_reading: 150,
      },
    }),
  ]);

  console.log(
    'Time test seed: created',
    APARTMENT_NAME,
    '| room 101 has 2025-01 reading | room 102 missing initial (for utility entry test)'
  );
}
