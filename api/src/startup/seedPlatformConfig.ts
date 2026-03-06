import { prisma } from '../lib/prisma.js';

const DEFAULT_BRAND = {
  app_name: '公寓管理系统',
  app_description: '多租户 SaaS 公寓/物业管理系统',
  logo_url: '',
  favicon_url: '',
  login_subtitle: '用户登录，管理公寓、租客与账单',
  register_subtitle: '创建新账户',
};

const DEFAULT_USAGE_PRICING = {
  price_per_org: 0,
  price_per_apartment: 0,
  price_per_room: 0,
  price_per_member: 0,
};

export async function seedPlatformConfig(): Promise<void> {
  const existing = await prisma.platformConfig.findUnique({ where: { id: 'default' } });
  if (existing) return;
  await prisma.platformConfig.create({
    data: {
      id: 'default',
      brand: DEFAULT_BRAND,
      usage_pricing: DEFAULT_USAGE_PRICING,
    },
  });
  console.log('Created platform config');
}
