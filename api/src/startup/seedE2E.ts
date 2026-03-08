import { ulid } from 'ulid';
import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../utils/security.js';

// ==================== E2E 测试常量 ====================

/** E2E 测试用固定用户 */
export const E2E_TEST_DATA = {
  // 运营后台管理员
  admin: {
    username: 'admin',
    password: 'admin123',
    name: 'E2E测试管理员',
    roleName: 'E2E超级管理员',
  },
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
 * 确保 E2E 测试套餐存在
 */
async function ensureE2ETestPlan(): Promise<string> {
  let plan = await prisma.subscriptionPlan.findFirst({
    where: { code: 'e2e-test-plan' },
  });
  if (!plan) {
    plan = await prisma.subscriptionPlan.create({
      data: {
        id: ulid().toLowerCase(),
        name: 'E2E 测试套餐',
        code: 'e2e-test-plan',
        description: 'E2E 自动化测试专用套餐，具有高额度限制',
        price_monthly: 0,
        price_yearly: 0,
        max_organizations: 10,
        max_apartments: 100,
        max_rooms: 10000,
        max_members: 50,
        rooms_count_scope: 'organization',
        members_count_scope: 'organization',
        is_active: true,
        sort_order: 999,
      },
    });
    console.log('E2E seed: created test plan e2e-test-plan');
  }
  return plan.id;
}

/**
 * 确保组织有订阅
 */
async function ensureOrgSubscription(orgId: string, planId: string): Promise<void> {
  const existingSub = await prisma.organizationSubscription.findUnique({
    where: { organization_id: orgId },
  });
  if (!existingSub) {
    await prisma.organizationSubscription.create({
      data: {
        id: ulid().toLowerCase(),
        organization_id: orgId,
        plan_id: planId,
        status: 'active',
        billing_cycle: 'monthly',
        start_date: new Date(),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1年后过期
        auto_renew: true,
      },
    });
    console.log('E2E seed: created subscription for org', orgId);
  } else if (existingSub.plan_id !== planId) {
    // 更新到 E2E 测试套餐
    await prisma.organizationSubscription.update({
      where: { id: existingSub.id },
      data: { plan_id: planId },
    });
    console.log('E2E seed: updated subscription to e2e-test-plan for org', orgId);
  }
}

/**
 * 创建 E2E 测试用户和组织
 */
export async function seedE2EUser(): Promise<{ userId: string; orgId: string }> {
  // 先确保 E2E 测试套餐存在
  const planId = await ensureE2ETestPlan();

  const existing = await prisma.user.findUnique({ where: { phone: E2E_TEST_DATA.user.phone } });
  if (existing) {
    // 获取用户的组织
    const membership = await prisma.organizationMember.findFirst({
      where: { user_id: existing.id },
      include: { organization: true },
    });
    const orgId = membership?.organization_id || '';

    // 确保现有组织有 E2E 测试套餐订阅
    if (orgId) {
      await ensureOrgSubscription(orgId, planId);
    }

    console.log('E2E seed: user already exists', E2E_TEST_DATA.user.phone);
    return {
      userId: existing.id,
      orgId,
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

  // 为新组织创建订阅
  await ensureOrgSubscription(orgId, planId);

  console.log('E2E seed: created test user', E2E_TEST_DATA.user.phone);
  return { userId, orgId };
}

/**
 * 创建 E2E 测试管理员
 */
export async function seedE2EAdmin(): Promise<{ adminUserId: string }> {
  // 创建管理员角色（如果不存在）
  let role = await prisma.adminRole.findFirst({
    where: { name: E2E_TEST_DATA.admin.roleName },
  });

  if (!role) {
    role = await prisma.adminRole.create({
      data: {
        id: ulid().toLowerCase(),
        name: E2E_TEST_DATA.admin.roleName,
        permissions: ['*'], // 超级管理员拥有所有权限
        is_system: true,
      },
    });
    console.log('E2E seed: created admin role', E2E_TEST_DATA.admin.roleName);
  }

  // 检查管理员是否已存在
  const existingAdmin = await prisma.adminUser.findUnique({
    where: { username: E2E_TEST_DATA.admin.username },
  });

  const passwordHash = await hashPassword(E2E_TEST_DATA.admin.password);

  if (existingAdmin) {
    // 更新密码以确保测试可以登录
    await prisma.adminUser.update({
      where: { id: existingAdmin.id },
      data: {
        password_hash: passwordHash,
        is_active: true,
        role_id: role.id,
      },
    });
    console.log('E2E seed: updated admin user password', E2E_TEST_DATA.admin.username);
    return { adminUserId: existingAdmin.id };
  }

  // 创建管理员账号
  const adminUserId = ulid().toLowerCase();

  await prisma.adminUser.create({
    data: {
      id: adminUserId,
      username: E2E_TEST_DATA.admin.username,
      password_hash: passwordHash,
      name: E2E_TEST_DATA.admin.name,
      role_id: role.id,
      is_active: true,
      is_system: true,
    },
  });

  console.log('E2E seed: created admin user', E2E_TEST_DATA.admin.username);
  return { adminUserId };
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

  // 1. 创建管理员
  await seedE2EAdmin();

  // 2. 创建用户和组织
  const { userId, orgId } = await seedE2EUser();

  // 3. 创建公寓和房间
  await seedE2EApartments(orgId);

  // 4. 创建租客
  await seedE2ETenants(orgId);

  // 5. 创建租约
  await seedE2ELeases(orgId);

  // 6. 创建水电配置
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

  // 删除管理员账号
  const admin = await prisma.adminUser.findUnique({
    where: { username: E2E_TEST_DATA.admin.username },
  });
  if (admin) {
    await prisma.adminUser.delete({ where: { id: admin.id } });
    console.log('E2E clean: deleted admin user');
  }

  // 删除管理员角色
  const adminRole = await prisma.adminRole.findFirst({
    where: { name: E2E_TEST_DATA.admin.roleName },
  });
  if (adminRole) {
    await prisma.adminRole.delete({ where: { id: adminRole.id } });
    console.log('E2E clean: deleted admin role');
  }

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
