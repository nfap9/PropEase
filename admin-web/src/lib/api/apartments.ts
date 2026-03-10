import api from './client';
import {
  Apartment,
  ApartmentWithStats,
  Room,
  RoomBatchCreate,
  UtilityConfig,
  UtilityConfigCreate,
  UtilityConfigUpdate,
} from '@/types';

export const apartmentsApi = {
  list: async (orgId: string): Promise<ApartmentWithStats[]> => {
    const response = await api.get<ApartmentWithStats[]>('/apartments', {
      params: { org_id: orgId },
    });
    return response.data;
  },

  get: async (orgId: string, id: string): Promise<Apartment> => {
    const response = await api.get<Apartment>(`/apartments/${id}`, { params: { org_id: orgId } });
    return response.data;
  },

  create: async (orgId: string, data: Partial<Apartment>): Promise<Apartment> => {
    const response = await api.post<Apartment>('/apartments', data, { params: { org_id: orgId } });
    return response.data;
  },

  update: async (orgId: string, id: string, data: Partial<Apartment>): Promise<Apartment> => {
    const response = await api.put<Apartment>(`/apartments/${id}`, data, {
      params: { org_id: orgId },
    });
    return response.data;
  },

  delete: async (orgId: string, id: string): Promise<void> => {
    await api.delete(`/apartments/${id}`, { params: { org_id: orgId } });
  },
};

export const roomsApi = {
  list: async (orgId: string, apartmentId: string): Promise<Room[]> => {
    const response = await api.get<Room[]>(`/apartments/${apartmentId}/rooms`, {
      params: { org_id: orgId },
    });
    return response.data;
  },

  // 获取组织内所有房间（跨公寓）
  listAll: async (orgId: string, apartmentIds: string[]): Promise<Room[]> => {
    const roomPromises = apartmentIds.map((aptId) =>
      api.get<Room[]>(`/apartments/${aptId}/rooms`, { params: { org_id: orgId } })
    );
    const responses = await Promise.all(roomPromises);
    return responses.flatMap((res) => res.data);
  },

  get: async (orgId: string, id: string): Promise<Room> => {
    const response = await api.get<Room>(`/apartments/rooms/${id}`, { params: { org_id: orgId } });
    return response.data;
  },

  create: async (orgId: string, apartmentId: string, data: Partial<Room>): Promise<Room> => {
    const response = await api.post<Room>(`/apartments/${apartmentId}/rooms`, data, {
      params: { org_id: orgId },
    });
    return response.data;
  },

  batchCreate: async (
    orgId: string,
    apartmentId: string,
    data: RoomBatchCreate
  ): Promise<Room[]> => {
    const response = await api.post<Room[]>(`/apartments/${apartmentId}/rooms/batch`, data, {
      params: { org_id: orgId },
    });
    return response.data;
  },

  update: async (orgId: string, id: string, data: Partial<Room>): Promise<Room> => {
    const response = await api.put<Room>(`/apartments/rooms/${id}`, data, {
      params: { org_id: orgId },
    });
    return response.data;
  },

  delete: async (orgId: string, id: string): Promise<void> => {
    await api.delete(`/apartments/rooms/${id}`, { params: { org_id: orgId } });
  },
};

export const utilityConfigApi = {
  get: async (orgId: string, apartmentId: string): Promise<UtilityConfig> => {
    const response = await api.get<UtilityConfig>(`/apartments/${apartmentId}/utility-config`, {
      params: { org_id: orgId },
    });
    return response.data;
  },

  createOrUpdate: async (
    orgId: string,
    apartmentId: string,
    data: UtilityConfigCreate
  ): Promise<UtilityConfig> => {
    const response = await api.post<UtilityConfig>(
      `/apartments/${apartmentId}/utility-config`,
      data,
      {
        params: { org_id: orgId },
      }
    );
    return response.data;
  },

  update: async (
    orgId: string,
    apartmentId: string,
    data: UtilityConfigUpdate
  ): Promise<UtilityConfig> => {
    const response = await api.put<UtilityConfig>(
      `/apartments/${apartmentId}/utility-config`,
      data,
      {
        params: { org_id: orgId },
      }
    );
    return response.data;
  },

  delete: async (orgId: string, apartmentId: string): Promise<void> => {
    await api.delete(`/apartments/${apartmentId}/utility-config`, { params: { org_id: orgId } });
  },
};

export default apartmentsApi;
