/**
 * 用量付费模块数据迁移脚本
 *
 * 将旧表数据迁移到新的统一订单模型：
 * - SubscriptionOrder -> BillingOrder (order_type = 'subscription')
 * - UsageQuotaOrder -> BillingOrder (order_type = 'usage')
 * - UsageQuota -> UsageAllowance
 *
 * 执行方式：npx tsx src/migrations/001_billing_consolidation.ts
 */

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { ulid } from 'ulid';

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function migrate() {
  console.log('开始用量付费模块数据迁移...\n');

  // 1. 迁移 SubscriptionOrder 到 BillingOrder
  console.log('1. 迁移 SubscriptionOrder 到 BillingOrder...');
  const subscriptionOrders = await prisma.subscriptionOrder.findMany();
  console.log(`   找到 ${subscriptionOrders.length} 条订阅订单`);

  for (const order of subscriptionOrders) {
    await prisma.billingOrder.create({
      data: {
        id: ulid().toLowerCase(),
        order_no: order.order_no,
        order_type: 'subscription',
        organization_id: order.organization_id,
        user_id: undefined,
        service_id: order.service_id,
        pricing_id: order.pricing_id,
        billing_months: order.billing_months,
        usage_details: undefined,
        amount: order.amount,
        original_amount: order.original_amount,
        currency: order.currency,
        status: order.status,
        payment_method: order.payment_method,
        code_url: order.code_url,
        wechat_transaction_id: order.wechat_transaction_id,
        paid_at: order.paid_at,
        expires_at: order.expires_at,
        applied_discounts: order.applied_discounts ?? undefined,
        total_discount: order.total_discount,
        total_gift_months: order.total_gift_months,
        balance_deduction: order.balance_deduction,
        subscription_id: order.organization_subscription_id,
        created_at: order.created_at,
        updated_at: order.updated_at,
      },
    });
    console.log(`   迁移订单: ${order.order_no}`);
  }
  console.log(`   完成迁移 ${subscriptionOrders.length} 条订阅订单\n`);

  // 2. 迁移 UsageQuotaOrder 到 BillingOrder
  console.log('2. 迁移 UsageQuotaOrder 到 BillingOrder...');
  const usageQuotaOrders = await prisma.usageQuotaOrder.findMany();
  console.log(`   找到 ${usageQuotaOrders.length} 条用量订单`);

  for (const order of usageQuotaOrders) {
    await prisma.billingOrder.create({
      data: {
        id: ulid().toLowerCase(),
        order_no: order.order_no,
        order_type: 'usage',
        organization_id: undefined, // UsageQuotaOrder 不关联 organization，需要后续处理
        user_id: order.user_id,
        service_id: undefined,
        pricing_id: undefined,
        billing_months: undefined,
        usage_details: {
          orgs: order.orgs,
          apartments: order.apartments,
          rooms: order.rooms,
          members: order.members,
        },
        amount: order.amount,
        original_amount: order.amount,
        currency: order.currency,
        status: order.status,
        payment_method: 'wechat_native', // UsageQuotaOrder 没有 payment_method 字段
        code_url: order.code_url,
        wechat_transaction_id: order.wechat_transaction_id,
        paid_at: order.paid_at,
        expires_at: order.expires_at,
        applied_discounts: undefined,
        total_discount: undefined,
        total_gift_months: 0,
        balance_deduction: undefined,
        subscription_id: undefined,
        created_at: order.created_at,
        updated_at: order.updated_at,
      },
    });
    console.log(`   迁移订单: ${order.order_no}`);
  }
  console.log(`   完成迁移 ${usageQuotaOrders.length} 条用量订单\n`);

  // 3. 迁移 UsageQuota 到 UsageAllowance
  // 注意：UsageQuota 关联 user_id，但 UsageAllowance 关联 organization_id
  // 需要通过 user 找到 organization 来建立关联
  console.log('3. 迁移 UsageQuota 到 UsageAllowance...');
  const usageQuotas = await prisma.usageQuota.findMany({
    include: {
      user: {
        include: {
          organization_memberships: {
            where: { role: 'owner' },
            take: 1,
          },
        },
      },
    },
  });
  console.log(`   找到 ${usageQuotas.length} 条用量配额记录`);

  for (const quota of usageQuotas) {
    // 尝试找到用户的默认组织
    const orgId = quota.user.organization_memberships[0]?.organization_id;

    if (!orgId) {
      console.log(`   跳过配额 ${quota.id}：用户 ${quota.user_id} 没有关联组织`);
      continue;
    }

    // 解析 valid_from 和 valid_to 获取年月
    const validFrom = new Date(quota.valid_from);
    const year = validFrom.getFullYear();
    const month = validFrom.getMonth() + 1;

    await prisma.usageAllowance.create({
      data: {
        id: ulid().toLowerCase(),
        organization_id: orgId,
        year,
        month,
        orgs: quota.orgs,
        apartments: quota.apartments,
        rooms: quota.rooms,
        members: quota.members,
        billing_order_id: null, // 可以后续关联到新创建的 BillingOrder
        created_at: quota.created_at,
        updated_at: quota.updated_at,
      },
    });
    console.log(`   迁移配额: ${quota.id} -> 组织 ${orgId} (${year}-${month})`);
  }
  console.log(`   完成迁移 ${usageQuotas.length} 条用量配额\n`);

  // 4. 迁移 PlatformConfig.usage_pricing 到 UsageUnitPricing
  console.log('4. 迁移 PlatformConfig.usage_pricing 到 UsageUnitPricing...');
  const platformConfig = await prisma.platformConfig.findFirst();

  if (platformConfig?.usage_pricing) {
    const pricing = platformConfig.usage_pricing as Record<string, number>;
    const now = new Date();

    if (pricing.price_per_org !== undefined) {
      await prisma.usageUnitPricing.create({
        data: {
          id: ulid().toLowerCase(),
          unit_type: 'org',
          price_per_unit: pricing.price_per_org,
          is_active: true,
          valid_from: now,
        },
      });
      console.log(`   迁移单价: org = ${pricing.price_per_org}`);
    }
    if (pricing.price_per_apartment !== undefined) {
      await prisma.usageUnitPricing.create({
        data: {
          id: ulid().toLowerCase(),
          unit_type: 'apartment',
          price_per_unit: pricing.price_per_apartment,
          is_active: true,
          valid_from: now,
        },
      });
      console.log(`   迁移单价: apartment = ${pricing.price_per_apartment}`);
    }
    if (pricing.price_per_room !== undefined) {
      await prisma.usageUnitPricing.create({
        data: {
          id: ulid().toLowerCase(),
          unit_type: 'room',
          price_per_unit: pricing.price_per_room,
          is_active: true,
          valid_from: now,
        },
      });
      console.log(`   迁移单价: room = ${pricing.price_per_room}`);
    }
    if (pricing.price_per_member !== undefined) {
      await prisma.usageUnitPricing.create({
        data: {
          id: ulid().toLowerCase(),
          unit_type: 'member',
          price_per_unit: pricing.price_per_member,
          is_active: true,
          valid_from: now,
        },
      });
      console.log(`   迁移单价: member = ${pricing.price_per_member}`);
    }
    console.log('   用量单价迁移完成\n');
  } else {
    console.log('   未找到用量单价配置，跳过\n');
  }

  console.log('========================================');
  console.log('数据迁移完成！');
  console.log('');
  console.log('迁移统计:');
  console.log(`  - 订阅订单: ${subscriptionOrders.length} 条`);
  console.log(`  - 用量订单: ${usageQuotaOrders.length} 条`);
  console.log(`  - 用量配额: ${usageQuotas.length} 条`);
  console.log('');
  console.log('后续步骤:');
  console.log('  1. 验证迁移数据完整性');
  console.log('  2. 更新前端代码使用新 API');
  console.log('  3. 确认无误后可删除旧表（可选）');
  console.log('========================================');
}

async function verify() {
  console.log('\n验证迁移数据...\n');

  const billingOrders = await prisma.billingOrder.count();
  const subscriptionOrders = await prisma.subscriptionOrder.count();
  const usageQuotaOrders = await prisma.usageQuotaOrder.count();
  const usageAllowances = await prisma.usageAllowance.count();
  const usageUnitPricings = await prisma.usageUnitPricing.count();

  console.log('记录数对比:');
  console.log(`  BillingOrder: ${billingOrders} (应等于 ${subscriptionOrders} + ${usageQuotaOrders} = ${subscriptionOrders + usageQuotaOrders})`);
  console.log(`  UsageAllowance: ${usageAllowances}`);
  console.log(`  UsageUnitPricing: ${usageUnitPricings}`);

  // 验证金额汇总
  const oldSubscriptionTotal = await prisma.subscriptionOrder.aggregate({
    _sum: { amount: true },
  });
  const newSubscriptionTotal = await prisma.billingOrder.aggregate({
    where: { order_type: 'subscription' },
    _sum: { amount: true },
  });

  console.log(`\n订阅订单金额汇总:`);
  console.log(`  旧表总额: ${oldSubscriptionTotal._sum.amount}`);
  console.log(`  新表总额: ${newSubscriptionTotal._sum.amount}`);
  console.log(`  匹配: ${oldSubscriptionTotal._sum.amount === newSubscriptionTotal._sum.amount ? '是' : '否'}`);
}

async function main() {
  try {
    const command = process.argv[2] || 'migrate';

    if (command === 'verify') {
      await verify();
    } else {
      await migrate();
      await verify();
    }
  } catch (error) {
    console.error('迁移失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
