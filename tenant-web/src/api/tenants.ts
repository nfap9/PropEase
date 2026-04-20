import api from './client';
import { Tenant } from '@/types';

export const tenantsApi = {
  list: async (search?: string): Promise<Tenant[]> => {
    const response = await api.get<Tenant[]>('/tenants', {
      params: { search },
    });
    return response.data;
  },

  get: async (id: string): Promise<Tenant> => {
    const response = await api.get<Tenant>(`/tenants/${id}`);
    return response.data;
  },

  create: async (data: Partial<Tenant>): Promise<Tenant> => {
    const response = await api.post<Tenant>('/tenants', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Tenant>): Promise<Tenant> => {
    const response = await api.put<Tenant>(`/tenants/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/tenants/${id}`);
  },
};

export default tenantsApi;
