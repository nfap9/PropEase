import api from './client';
import { Lease } from '@/types';

export const leasesApi = {
  list: async (orgId: number, isActive?: boolean): Promise<Lease[]> => {
    const response = await api.get<Lease[]>('/leases', {
      params: { org_id: orgId, is_active: isActive },
    });
    return response.data;
  },

  get: async (orgId: number, id: number): Promise<Lease> => {
    const response = await api.get<Lease>(`/leases/${id}`, { params: { org_id: orgId } });
    return response.data;
  },

  create: async (orgId: number, data: Partial<Lease>): Promise<Lease> => {
    const response = await api.post<Lease>('/leases', data, { params: { org_id: orgId } });
    return response.data;
  },

  update: async (orgId: number, id: number, data: Partial<Lease>): Promise<Lease> => {
    const response = await api.put<Lease>(`/leases/${id}`, data, { params: { org_id: orgId } });
    return response.data;
  },

  terminate: async (orgId: number, id: number): Promise<void> => {
    await api.post(`/leases/${id}/terminate`, {}, { params: { org_id: orgId } });
  },

  delete: async (orgId: number, id: number): Promise<void> => {
    await api.delete(`/leases/${id}`, { params: { org_id: orgId } });
  },
};

export default leasesApi;
