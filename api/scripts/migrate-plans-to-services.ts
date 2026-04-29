/**
 * 一次性数据迁移脚本：SubscriptionPlan -> ServiceProduct
 *
 * 执行方式：
 * 1. 确保 prisma db push 已执行（新表已创建）
 * 2. 运行: pnpm exec tsx scripts/migrate-plans-to-services.ts
 * 3. 验证数据迁移正确后，可删除旧表 subscription_plans, plan_pricing
 *
 * 说明：
 * - 该脚本仅用于服务定价重构的历史数据迁移
 * - 保留在 scripts 目录，避免和 Prisma schema / migration 文件混在一起
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始迁移 SubscriptionPlan -> ServiceProduct...');

  // 1. 迁移 SubscriptionPlan -> ServiceProduct
  console.log('\n1. 迁移服务产品数据...');
  const plans = await prisma.$queryRaw<any[]>`
    SELECT
      id, name, code, description,
      max_organizations, max_apartments, max_rooms, max_members,
      is_active, sort_order, created_at, updated_at
    FROM subscription_plans
  `;

  console.log(`   找到 ${plans.length} 个套餐`);

  for (const plan of plans) {
    await prisma.serviceProduct.create({
      data: {
        id: plan.id,
        name: plan.name,
        code: plan.code,
        description: plan.description,
        max_organizations: plan.max_organizations,
        max_apartments: plan.max_apartments ?? 1,
        max_rooms: plan.max_rooms ?? 100,
        max_members: plan.max_members ?? 1,
        is_active: plan.is_active ?? true,
        sort_order: plan.sort_order ?? 0,
        created_at: plan.created_at,
        updated_at: plan.updated_at,
      },
    });
    console.log(`   ✓ 迁移套餐: ${plan.name} (${plan.code})`);
  }

  // 2. 迁移 PlanPricing -> ServicePricing
  console.log('\n2. 迁移服务定价数据...');
  const pricings = await prisma.$queryRaw<any[]>`
    SELECT id, plan_id, months, price, is_active, sort_order, created_at, updated_at
    FROM plan_pricing
  `;

  console.log(`   找到 ${pricings.length} 条定价记录`);

  for (const pricing of pricings) {
    await prisma.servicePricing.create({
      data: {
        id: pricing.id,
        service_id: pricing.plan_id,
        months: pricing.months,
        price: pricing.price,
        is_active: pricing.is_active ?? true,
        sort_order: pricing.sort_order ?? 0,
        created_at: pricing.created_at,
        updated_at: pricing.updated_at,
      },
    });
  }
  console.log(`   ✓ 已迁移 ${pricings.length} 条定价记录`);

  // 3. 更新 OrganizationSubscription.plan_id -> service_id
  console.log('\n3. 更新组织订阅的关联字段...');
  const subsResult = await prisma.$executeRaw`
    UPDATE organization_subscriptions
    SET service_id = plan_id
    WHERE plan_id IS NOT NULL AND service_id IS NULL
  `;
  console.log(`   ✓ 更新了 ${subsResult} 条订阅记录`);

  // 4. 更新 SubscriptionOrder.plan_id -> service_id
  console.log('\n4. 更新订阅订单的关联字段...');
  const ordersResult = await prisma.$executeRaw`
    UPDATE subscription_orders
    SET service_id = plan_id
    WHERE plan_id IS NOT NULL AND service_id IS NULL
  `;
  console.log(`   ✓ 更新了 ${ordersResult} 条订单记录`);

  console.log('\n✅ 迁移完成！');
  console.log('\n后续步骤：');
  console.log('1. 验证数据迁移正确');
  console.log('2. 运行测试: pnpm test');
  console.log('3. 部署新代码');
  console.log('4. 确认无问题后，可删除旧表（可选）：');
  console.log('   DROP TABLE IF EXISTS plan_pricing;');
  console.log('   DROP TABLE IF EXISTS subscription_plans;');
}

main()
  .catch((e) => {
    console.error('迁移失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
