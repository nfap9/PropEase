import api from './client';
import {
  Permission,
  RolePermissions,
  UpdateRolePermissionsRequest,
  UserPermissionsResponse,
  MemberRole,
} from '@/types';

export const permissionsApi = {
  /**
   * 获取所有权限列表
   */
  getAll: async (): Promise<Permission[]> => {
    const response = await api.get<Permission[]>('/permissions');
    return response.data;
  },

  /**
   * 获取按资源分组的权限
   */
  getGrouped: async (): Promise<Record<string, Permission[]>> => {
    const response = await api.get<Record<string, Permission[]>>('/permissions/grouped');
    return response.data;
  },

  /**
   * 获取组织角色的权限配置
   */
  getRolePermissions: async (
    orgId: string,
    role: MemberRole
  ): Promise<RolePermissions> => {
    const response = await api.get<RolePermissions>(
      `/permissions/organization/${orgId}/roles/${role}`
    );
    return response.data;
  },

  /**
   * 更新组织角色权限配置
   */
  updateRolePermissions: async (
    orgId: string,
    role: MemberRole,
    data: UpdateRolePermissionsRequest
  ): Promise<void> => {
    await api.put(`/permissions/organization/${orgId}/roles/${role}`, data);
  },

  /**
   * 获取当前用户在组织中的权限
   */
  getMyPermissions: async (orgId: string): Promise<UserPermissionsResponse> => {
    const response = await api.get<UserPermissionsResponse>(
      `/permissions/me?org_id=${orgId}`
    );
    return response.data;
  },

  /**
   * 获取当前用户的系统角色
   */
  getMySystemRoles: async (): Promise<string[]> => {
    const response = await api.get<string[]>('/permissions/system-roles/me');
    return response.data;
  },
};

export default permissionsApi;
