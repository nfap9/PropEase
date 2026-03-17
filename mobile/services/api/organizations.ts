import api from './client'
import type {
  Organization,
  OrganizationCreate,
  OrganizationMember,
  OrganizationUpdate,
  OrganizationUsage,
} from '@apartment-ultra/api-contract'

export type { OrganizationMember };

export const organizationsApi = {
  /**
   * 获取用户所属组织列表
   */
  list: async (): Promise<Organization[]> => {
    return api.get<Organization[]>('/organizations')
  },

  /**
   * 获取个人组织
   */
  getPersonal: async (): Promise<Organization> => {
    return api.get<Organization>('/organizations/personal')
  },

  /**
   * 获取组织详情
   */
  get: async (orgId: string): Promise<Organization> => {
    return api.get<Organization>(`/organizations/${orgId}`, undefined, { skipOrgId: true })
  },

  /**
   * 创建组织
   */
  create: async (data: OrganizationCreate): Promise<Organization> => {
    return api.post<Organization>('/organizations', data, { skipOrgId: true })
  },

  /**
   * 更新组织
   */
  update: async (orgId: string, data: OrganizationUpdate): Promise<Organization> => {
    return api.put<Organization>(`/organizations/${orgId}`, data, { skipOrgId: true })
  },

  /**
   * 删除组织
   */
  delete: async (orgId: string): Promise<void> => {
    return api.delete<void>(`/organizations/${orgId}`, undefined, { skipOrgId: true })
  },

  /**
   * 获取组织成员列表
   */
  getMembers: async (orgId: string): Promise<OrganizationMember[]> => {
    return api.get<OrganizationMember[]>(`/organizations/${orgId}/members`, undefined, { skipOrgId: true })
  },

  /**
   * 获取组织用量统计
   */
  getUsage: async (orgId: string): Promise<OrganizationUsage> => {
    return api.get<OrganizationUsage>(`/organizations/${orgId}/usage`, undefined, { skipOrgId: true })
  },
}

export default organizationsApi
