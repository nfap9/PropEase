import { ulid } from 'ulid';
import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../utils/security.js';

// ==================== E2E 测试常量 ====================

/** E2E 测试用固定用户 */
export const E2E_TEST_DATA = {
  // 用户配置
  user: {
    phone: '13800138000',
    password: 'Test1234',
    fullName: 'E2E测试用户',
  },
  // 个人组织
  personalOrg: {
    name: 'E2E个人组织',
    slug: 'e2e-personal',
  },
  // 团队组织
  teamOrg: {
    name: 'E2E团队组织',
    slug: 'e2e-team',
  },
  // 测试公寓
  apartments: [
    {
      name: 'E2E测试公寓1',
      address: '测试地址1号',
      rooms: [
        { room_number: '101', monthly_rent: 1500, status: 'available' },
        { room_number: '102', monthly_rent: 1800, status: 'occupied' },
        { room_number: '103', monthly_rent: 2000, status: 'available' },
      ],
    },
    {
      name: 'E2E测试公寓2',
      address: '测试地址2号',
      rooms: [
        { room_number: '201', monthly_rent: 1200, status: 'available' },
        { room_number: '202', monthly_rent: 1500, status: 'available' },
      ],
    },
  ],
  // 测试租客
  tenants: [
    { name: '张三', phone: '13900139001', id_card: '110101199001011234' },
    { name: '李四', phone: '13900139002', id_card: '110101199002021234' },
    { name: '王五', phone: '13900139003', id_card: '110101199003031234' },
  ],
};

// ==================== 种子函数 ====================

/**
 * 创建 E2E 测试用户和组织
 */
export async function seedE2EUser(): Promise<{ userId: string; orgId: string }> {
  const existing = await prisma.user.findUnique({ where: { phone: E2E_TEST_DATA.user.phone } });
  if (existing) {
    // 获取用户的组织
    const membership = await prisma.organizationMember.findFirst({
      where: { user_id: existing.id },
      include: { organization: true },
    });
    return {
      userId: existing.id,
      orgId: membership?.organization_id || '',
    };
  }

  const passwordHash = await hashPassword(E2E_TEST_DATA.user.password);
  const userId = ulid().toLowerCase();

  await prisma.user.create({
    data: {
      id: userId,
      phone: E2E_TEST_DATA.user.phone,
      full_name: E2E_TEST_DATA.user.fullName,
      password_hash: passwordHash,
    },
  });

  const orgId = ulid().toLowerCase();
  await prisma.organization.create({
    data: {
      id: orgId,
      name: E2E_TEST_DATA.personalOrg.name,
      slug: E2E_TEST_DATA.personalOrg.slug,
      is_personal: true,
    },
  });

  await prisma.organizationMember.create({
    data: {
      id: ulid().toLowerCase(),
      organization_id: orgId,
      user_id: userId,
      role: 'owner',
    },
  });

  console.log('E2E seed: created test user', E2E_TEST_DATA.user.phone);
  return { userId, orgId };
}

/**
 * 创建测试公寓和房间
 */
export async function seedE2EApartments(orgId: string): Promise<void> {
  for (const aptData of E2E_TEST_DATA.apartments) {
    // 检查公寓是否已存在
    const existing = await prisma.apartment.findFirst({
      where: { organization_id: orgId, name: aptData.name },
    });
    if (existing) continue;

    const apartmentId = ulid().toLowerCase();

    await prisma.apartment.create({
      data: {
        id: apartmentId,
        organization_id: orgId,
        name: aptData.name,
        address: aptData.address,
      },
    });

    // 创建房间
    for (const roomData of aptData.rooms) {
      await prisma.room.create({
        data: {
          id: ulid().toLowerCase(),
          apartment_id: apartmentId,
          room_number: roomData.room_number,
          monthly_rent: roomData.monthly_rent,
          status: roomData.status,
        },
      });
    }

    console.log(`E2E seed: created apartment ${aptData.name} with ${aptData.rooms.length} rooms`);
  }
}

/**
 * 创建测试租客
 */
export async function seedE2ETenants(orgId: string): Promise<void> {
  for (const tenantData of E2E_TEST_DATA.tenants) {
    // 检查租客是否已存在
    const existing = await prisma.tenant.findFirst({
      where: { organization_id: orgId, name: tenantData.name },
    });
    if (existing) continue;

    await prisma.tenant.create({
      data: {
        id: ulid().toLowerCase(),
        organization_id: orgId,
        name: tenantData.name,
        phone: tenantData.phone,
        id_card: tenantData.id_card,
      },
    });
  }

  console.log(`E2E seed: created ${E2E_TEST_DATA.tenants.length} tenants`);
}

/**
 * 创建测试租约（关联房间和租客）
 */
export async function seedE2ELeases(orgId: string): Promise<void> {
  // 获取一个已入住房间和一个租客
  const room = await prisma.room.findFirst({
    where: { status: 'occupied', apartment: { organization_id: orgId } },
  });

  const tenant = await prisma.tenant.findFirst({
    where: { organization_id: orgId },
  });

  if (!room || !tenant) {
    console.log('E2E seed: skip leases - no room or tenant');
    return;
  }

  // 检查租约是否已存在
  const existingLease = await prisma.lease.findFirst({
    where: { room_id: room.id, tenant_id: tenant.id },
  });
  if (existingLease) return;

  const startDate = new Date();
  startDate.setDate(1); // 设置为当月第一天

  await prisma.lease.create({
    data: {
      id: ulid().toLowerCase(),
      room_id: room.id,
      tenant_id: tenant.id,
      start_date: startDate,
      rental_type: 'monthly',
      billing_day: 1,
      monthly_rent: room.monthly_rent,
      deposit: room.monthly_rent,
      water_rate: 5,
      electricity_rate: 1,
      is_active: true,
    },
  });

  console.log('E2E seed: created test lease');
}

/**
 * 创建测试水电配置
 */
export async function seedE2EUtilityConfig(orgId: string): Promise<void> {
  const apartments = await prisma.apartment.findMany({
    where: { organization_id: orgId },
  });

  for (const apartment of apartments) {
    // 检查配置是否已存在
    const existing = await prisma.utilityConfig.findUnique({
      where: { apartment_id: apartment.id },
    });
    if (existing) continue;

    await prisma.utilityConfig.create({
      data: {
        id: ulid().toLowerCase(),
        apartment_id: apartment.id,
        water_price_per_unit: 5,
        electricity_price_per_unit: 1,
        effective_from: new Date(),
      },
    });
  }

  console.log(`E2E seed: created utility configs for ${apartments.length} apartments`);
}

/**
 * 完整的 E2E 测试数据种子
 */
export async function seedE2E(): Promise<{ userId: string; orgId: string }> {
  console.log('E2E seed: starting...');

  // 1. 创建用户和组织
  const { userId, orgId } = await seedE2EUser();

  // 2. 创建公寓和房间
  await seedE2EApartments(orgId);

  // 3. 创建租客
  await seedE2ETenants(orgId);

  // 4. 创建租约
  await seedE2ELeases(orgId);

  // 5. 创建水电配置
  await seedE2EUtilityConfig(orgId);

  console.log('E2E seed: completed');
  return { userId, orgId };
}

/**
 * 清理 E2E 测试数据
 *
 * 注意：此操作会删除所有 E2E 测试相关的数据
 */
export async function cleanE2E(): Promise<void> {
  console.log('E2E clean: starting...');

  const user = await prisma.user.findUnique({
    where: { phone: E2E_TEST_DATA.user.phone },
  });

  if (!user) {
    console.log('E2E clean: no E2E user found');
    return;
  }

  // 获取用户的组织
  const memberships = await prisma.organizationMember.findMany({
    where: { user_id: user.id },
  });

  // 删除组织（会级联删除相关数据）
  for (const membership of memberships) {
    await prisma.organization.delete({
      where: { id: membership.organization_id },
    });
  }

  // 删除用户
  await prisma.user.delete({
    where: { id: user.id },
  });

  console.log('E2E clean: completed');
}

/**
 * 命令行入口
 *
 * 用法：
 * - pnpm seed:e2e          # 创建测试数据
 * - pnpm seed:e2e --clean  # 清理测试数据
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  try {
    if (args.includes('--clean')) {
      await cleanE2E();
    } else {
      await seedE2E();
    }
  } catch (error) {
    console.error('E2E seed error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 仅在直接运行时执行
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
