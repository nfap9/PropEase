import api from './client';
import { Lease } from '@/types';

export const leasesApi = {
  list: async (orgId: string, isActive?: boolean): Promise<Lease[]> => {
    const response = await api.get<Lease[]>('/leases', {
      params: { org_id: orgId, is_active: isActive },
    });
    return response.data;
  },

  get: async (orgId: string, id: string): Promise<Lease> => {
    const response = await api.get<Lease>(`/leases/${id}`, { params: { org_id: orgId } });
    return response.data;
  },

  create: async (orgId: string, data: Partial<Lease>): Promise<Lease> => {
    const response = await api.post<Lease>('/leases', data, { params: { org_id: orgId } });
    return response.data;
  },

  update: async (orgId: string, id: string, data: Partial<Lease>): Promise<Lease> => {
    const response = await api.put<Lease>(`/leases/${id}`, data, { params: { org_id: orgId } });
    return response.data;
  },

  terminate: async (orgId: string, id: string): Promise<void> => {
    await api.post(`/leases/${id}/terminate`, {}, { params: { org_id: orgId } });
  },

  delete: async (orgId: string, id: string): Promise<void> => {
    await api.delete(`/leases/${id}`, { params: { org_id: orgId } });
  },
};

export default leasesApi;
