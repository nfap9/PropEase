'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { configApi, type BrandConfig } from '@/api/config';

const DEFAULT_BRAND: BrandConfig = {
  app_name: '公寓管理系统',
  app_description: '公寓、租客与账单的一体化管理系统',
  logo_url: '',
  favicon_url: '',
  login_subtitle: '用户登录，管理公寓、租客与账单',
  register_subtitle: '创建新账户',
};

const BrandConfigContext = createContext<BrandConfig>(DEFAULT_BRAND);

export function BrandConfigProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: ['config', 'public'],
    queryFn: async () => {
      const res = await configApi.getPublic();
      return res.data.brand;
    },
    staleTime: 5 * 60 * 1000,
  });

  const brand = isLoading ? DEFAULT_BRAND : (data ?? DEFAULT_BRAND);

  return <BrandConfigContext.Provider value={brand}>{children}</BrandConfigContext.Provider>;
}

export function useBrandConfig(): BrandConfig {
  return useContext(BrandConfigContext);
}
