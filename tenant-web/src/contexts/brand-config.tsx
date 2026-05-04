
/**
 * 品牌配置 Context
 *
 * 从后端获取品牌配置（Logo、应用名称、登录页文案等），
 * 提供给全栈应用使用。
 *
 * 默认配置确保在 API 不可用时仍有合理回退
 */
import { createContext, useContext, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { configApi, type BrandConfig } from '@/api/config';

/** 默认品牌配置 */
const DEFAULT_BRAND: BrandConfig = {
  app_name: '公寓管理系统',
  logo_url: '',
  favicon_url: '',
};

const BrandConfigContext = createContext<BrandConfig>(DEFAULT_BRAND);

/**
 * 品牌配置 Provider
 * 从 /api/v1/config/public 端点获取品牌配置
 * 缓存 5 分钟避免频繁请求
 */
export function BrandConfigProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: ['config', 'public'],
    queryFn: async () => {
      const res = await configApi.getPublic();
      return res.data.brand;
    },
    // 品牌配置相对稳定，缓存 5 分钟
    staleTime: 5 * 60 * 1000,
  });

  // 加载中或获取失败时使用默认配置
  const brand = isLoading ? DEFAULT_BRAND : (data ?? DEFAULT_BRAND);

  return <BrandConfigContext.Provider value={brand}>{children}</BrandConfigContext.Provider>;
}

/**
 * 使用品牌配置的 Hook
 */
export function useBrandConfig(): BrandConfig {
  return useContext(BrandConfigContext);
}
