/**
 * 组织 API 模块
 *
 * 提供组织（Organization）相关的 API 调用：
 * - 组织 CRUD
 * - 组织成员管理
 * - 组织使用量查询
 * - 删除前预览
 */
import api from './client';
import {
  Organization,
  OrganizationMember,
  OrganizationUsage,
  MemberRole,
  DeletionPreview,
  OrganizationCreate,
} from '@/types';

/** 组织相关 API */
export const organizationsApi = {
  /** 获取当前用户的所有组织列表 */
  list: async (): Promise<Organization[]> => {
    const response = await api.get<Organization[]>('/organizations');
    return response.data;
  },

  /** 获取单个组织详情 */
  get: async (id: string): Promise<Organization> => {
    const response = await api.get<Organization>(`/organizations/${id}`);
    return response.data;
  },

  /** 创建新组织 */
  create: async (data: OrganizationCreate): Promise<Organization> => {
    const response = await api.post<Organization>('/organizations', data);
    return response.data;
  },

  /** 更新组织信息 */
  update: async (id: string, data: Partial<Organization>): Promise<Organization> => {
    const response = await api.put<Organization>(`/organizations/${id}`, data);
    return response.data;
  },

  /** 获取删除组织前的预览（检查关联数据） */
  getDeletionPreview: async (id: string): Promise<DeletionPreview> => {
    const response = await api.get<DeletionPreview>(`/organizations/${id}/deletion-preview`);
    return response.data;
  },

  /**
   * 删除组织
   * @param id 组织 ID
   * @param confirmedName 需输入组织名称确认删除
   */
  delete: async (id: string, confirmedName: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/organizations/${id}`, {
      data: { confirmed_name: confirmedName },
    });
    return response.data;
  },

  /** 获取组织使用量（房间数、成员数等） */
  getUsage: async (orgId: string): Promise<OrganizationUsage> => {
    const response = await api.get<OrganizationUsage>(`/organizations/${orgId}/usage`);
    return response.data;
  },

  /** 获取组织成员列表 */
  getMembers: async (orgId: string): Promise<OrganizationMember[]> => {
    const response = await api.get<OrganizationMember[]>(`/organizations/${orgId}/members`);
    return response.data;
  },

  /**
   * 添加组织成员
   * @param orgId 组织 ID
   * @param data 成员手机号和角色
   */
  addMember: async (
    orgId: string,
    data: { user_phone: string; role: MemberRole }
  ): Promise<OrganizationMember> => {
    const params = new URLSearchParams({ phone: data.user_phone, role: data.role });
    const response = await api.post<OrganizationMember>(
      `/organizations/${orgId}/members?${params}`
    );
    return response.data;
  },

  /**
   * 更新组织成员角色
   * @param orgId 组织 ID
   * @param memberId 成员 ID
   * @param data 新的角色
   */
  updateMember: async (
    orgId: string,
    memberId: string,
    data: { role: MemberRole }
  ): Promise<OrganizationMember> => {
    const params = new URLSearchParams({ role: data.role });
    const response = await api.put<OrganizationMember>(
      `/organizations/${orgId}/members/${memberId}?${params}`
    );
    return response.data;
  },

  /** 移除组织成员 */
  removeMember: async (orgId: string, memberId: string): Promise<void> => {
    await api.delete(`/organizations/${orgId}/members/${memberId}`);
  },

  /** 获取当前用户的个人团队组织 */
  getPersonalTeam: async (): Promise<Organization> => {
    const response = await api.get<Organization>('/organizations/personal');
    return response.data;
  },
};

export default organizationsApi;
