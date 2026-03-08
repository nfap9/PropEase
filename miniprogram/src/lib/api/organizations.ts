import api from './client';
import type { Organization } from '@apartment-ultra/api-contract';

export const organizationsApi = {
  /**
   * 获取用户所属组织列表
   */
  list: async (): Promise<Organization[]> => {
    return api.get<Organization[]>('/organizations');
  },

  /**
   * 获取组织详情
   */
  get: async (orgId: string): Promise<Organization> => {
    return api.get<Organization>(`/organizations/${orgId}`);
  },
};
