/**
 * 公开配置 API - 无需认证
 */
import { api } from './client';

export interface BrandConfig {
  app_name: string;
  app_description: string;
  logo_url: string;
  favicon_url: string;
  login_subtitle: string;
  register_subtitle: string;
}

export const configApi = {
  getPublic: () => api.get<{ brand: BrandConfig }>('/config/public'),
};
