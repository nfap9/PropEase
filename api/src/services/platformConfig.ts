import { prisma } from '../lib/prisma.js';

export interface BrandConfig {
  app_name: string;
  app_description: string;
  logo_url: string;
  favicon_url: string;
  login_subtitle: string;
  register_subtitle: string;
}

export const DEFAULT_BRAND: BrandConfig = {
  app_name: '公寓管理系统',
  app_description: '多租户 SaaS 公寓/物业管理系统',
  logo_url: '',
  favicon_url: '',
  login_subtitle: '用户登录，管理公寓、租客与账单',
  register_subtitle: '创建新账户',
};

function parseBrand(brand: unknown): BrandConfig {
  if (!brand || typeof brand !== 'object') return DEFAULT_BRAND;
  const b = brand as Record<string, unknown>;
  return {
    app_name: typeof b.app_name === 'string' ? b.app_name : DEFAULT_BRAND.app_name,
    app_description:
      typeof b.app_description === 'string' ? b.app_description : DEFAULT_BRAND.app_description,
    logo_url: typeof b.logo_url === 'string' ? b.logo_url : DEFAULT_BRAND.logo_url,
    favicon_url: typeof b.favicon_url === 'string' ? b.favicon_url : DEFAULT_BRAND.favicon_url,
    login_subtitle:
      typeof b.login_subtitle === 'string' ? b.login_subtitle : DEFAULT_BRAND.login_subtitle,
    register_subtitle:
      typeof b.register_subtitle === 'string'
        ? b.register_subtitle
        : DEFAULT_BRAND.register_subtitle,
  };
}

export async function getBrandConfig(): Promise<BrandConfig> {
  const row = await prisma.platformConfig.findUnique({ where: { id: 'default' } });
  return parseBrand(row?.brand);
}
