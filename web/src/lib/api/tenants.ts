import api from './client';
import { Tenant } from '@/types';

export const tenantsApi = {
  list: async (orgId: number, search?: string): Promise<Tenant[]> => {
    const response = await api.get<Tenant[]>('/tenants', {
      params: { org_id: orgId, search },
    });
    return response.data;
  },

  get: async (orgId: number, id: number): Promise<Tenant> => {
    const response = await api.get<Tenant>(`/tenants/${id}`, { params: { org_id: orgId } });
    return response.data;
  },

  create: async (orgId: number, data: Partial<Tenant>): Promise<Tenant> => {
    const response = await api.post<Tenant>('/tenants', data, { params: { org_id: orgId } });
    return response.data;
  },

  update: async (orgId: number, id: number, data: Partial<Tenant>): Promise<Tenant> => {
    const response = await api.put<Tenant>(`/tenants/${id}`, data, { params: { org_id: orgId } });
    return response.data;
  },

  delete: async (orgId: number, id: number): Promise<void> => {
    await api.delete(`/tenants/${id}`, { params: { org_id: orgId } });
  },
};

export default tenantsApi;
