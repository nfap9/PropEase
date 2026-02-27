import api from './client';
import { Tenant } from '@/types';

export const tenantsApi = {
  list: async (orgId: string, search?: string): Promise<Tenant[]> => {
    const response = await api.get<Tenant[]>('/tenants', {
      params: { org_id: orgId, search },
    });
    return response.data;
  },

  get: async (orgId: string, id: string): Promise<Tenant> => {
    const response = await api.get<Tenant>(`/tenants/${id}`, { params: { org_id: orgId } });
    return response.data;
  },

  create: async (orgId: string, data: Partial<Tenant>): Promise<Tenant> => {
    const response = await api.post<Tenant>('/tenants', data, { params: { org_id: orgId } });
    return response.data;
  },

  update: async (orgId: string, id: string, data: Partial<Tenant>): Promise<Tenant> => {
    const response = await api.put<Tenant>(`/tenants/${id}`, data, { params: { org_id: orgId } });
    return response.data;
  },

  delete: async (orgId: string, id: string): Promise<void> => {
    await api.delete(`/tenants/${id}`, { params: { org_id: orgId } });
  },
};

export default tenantsApi;
