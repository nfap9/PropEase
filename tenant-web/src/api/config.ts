/**
 * 公开配置 API - 无需认证
 */
import type { BrandConfig, PublicConfig } from '@propease/api-contract';
import { api } from './client';

export type { BrandConfig };

export const configApi = {
  getPublic: () => api.get<PublicConfig>('/config/public'),
};
