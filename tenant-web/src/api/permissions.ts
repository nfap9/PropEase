import api from './client';

export interface Permission {
  resource: string;
  action: string;
  code: string;
  name: string;
}

export interface OrgRole {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  permissions: string[];
  member_count: number;
}

export interface RolePermissions {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  permissions: string[];
}

export const permissionsApi = {
  /**
   * 获取所有权限列表（静态定义）
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
   * 获取组织角色列表
   */
  getOrgRoles: async (orgId: string): Promise<OrgRole[]> => {
    const response = await api.get<OrgRole[]>('/permissions/org-roles', {
      params: { org_id: orgId },
    });
    return response.data;
  },

  /**
   * 创建角色
   */
  createOrgRole: async (orgId: string, data: {
    name: string;
    description?: string;
  }): Promise<OrgRole> => {
    const response = await api.post<OrgRole>('/permissions/org-roles', data, {
      params: { org_id: orgId },
    });
    return response.data;
  },

  /**
   * 更新角色
   */
  updateOrgRole: async (
    roleId: string,
    data: {
      name?: string;
      description?: string;
      permissions?: string[];
    }
  ): Promise<OrgRole> => {
    const response = await api.put<OrgRole>(`/permissions/org-roles/${roleId}`, data);
    return response.data;
  },

  /**
   * 删除角色
   */
  deleteOrgRole: async (orgId: string, roleId: string): Promise<void> => {
    await api.delete(`/permissions/org-roles/${roleId}`, {
      params: { org_id: orgId },
    });
  },

  /**
   * 获取角色权限
   */
  getRolePermissions: async (orgId: string, roleId: string): Promise<RolePermissions> => {
    const response = await api.get<RolePermissions>(
      `/permissions/org-roles/${roleId}/permissions`,
      { params: { org_id: orgId } }
    );
    return response.data;
  },

  /**
   * 更新角色权限
   */
  updateRolePermissions: async (
    orgId: string,
    roleId: string,
    permissionCodes: string[]
  ): Promise<void> => {
    await api.put(`/permissions/org-roles/${roleId}/permissions`, {
      permission_codes: permissionCodes,
    }, {
      params: { org_id: orgId },
    });
  },

  /**
   * 获取当前用户在组织中的权限
   */
  getMyPermissions: async (orgId: string): Promise<string[]> => {
    const response = await api.get<string[]>('/permissions/me', {
      params: { org_id: orgId },
    });
    return response.data;
  },
};

export default permissionsApi;
