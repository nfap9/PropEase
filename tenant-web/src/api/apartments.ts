import api from './client';
import {
  Apartment,
  ApartmentWithStats,
  Room,
  RoomBatchCreate,
  RoomUpdate,
  UtilityConfig,
  UtilityConfigCreate,
  UtilityConfigUpdate,
} from '@/types';

export const apartmentsApi = {
  list: async (): Promise<ApartmentWithStats[]> => {
    const response = await api.get<ApartmentWithStats[]>('/apartments');
    return response.data;
  },

  get: async (id: string): Promise<Apartment> => {
    const response = await api.get<Apartment>(`/apartments/${id}`);
    return response.data;
  },

  create: async (data: Partial<Apartment>): Promise<Apartment> => {
    const response = await api.post<Apartment>('/apartments', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Apartment>): Promise<Apartment> => {
    const response = await api.put<Apartment>(`/apartments/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/apartments/${id}`);
  },
};

export const roomsApi = {
  list: async (apartmentId: string): Promise<Room[]> => {
    const response = await api.get<Room[]>(`/apartments/${apartmentId}/rooms`);
    return response.data;
  },

  // 获取组织内所有房间（跨公寓）
  listAll: async (apartmentIds: string[]): Promise<Room[]> => {
    const roomPromises = apartmentIds.map((aptId) =>
      api.get<Room[]>(`/apartments/${aptId}/rooms`)
    );
    const responses = await Promise.all(roomPromises);
    return responses.flatMap((res) => res.data);
  },

  get: async (id: string): Promise<Room> => {
    const response = await api.get<Room>(`/apartments/rooms/${id}`);
    return response.data;
  },

  create: async (apartmentId: string, data: Partial<Room>): Promise<Room> => {
    const response = await api.post<Room>(`/apartments/${apartmentId}/rooms`, data);
    return response.data;
  },

  batchCreate: async (
    apartmentId: string,
    data: RoomBatchCreate
  ): Promise<Room[]> => {
    const response = await api.post<Room[]>(`/apartments/${apartmentId}/rooms/batch`, data);
    return response.data;
  },

  update: async (id: string, data: RoomUpdate): Promise<Room> => {
    const response = await api.put<Room>(`/apartments/rooms/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/apartments/rooms/${id}`);
  },
};

export const utilityConfigApi = {
  get: async (apartmentId: string): Promise<UtilityConfig> => {
    const response = await api.get<UtilityConfig>(`/apartments/${apartmentId}/utility-config`);
    return response.data;
  },

  createOrUpdate: async (
    apartmentId: string,
    data: UtilityConfigCreate
  ): Promise<UtilityConfig> => {
    const response = await api.post<UtilityConfig>(
      `/apartments/${apartmentId}/utility-config`,
      data
    );
    return response.data;
  },

  update: async (
    apartmentId: string,
    data: UtilityConfigUpdate
  ): Promise<UtilityConfig> => {
    const response = await api.put<UtilityConfig>(
      `/apartments/${apartmentId}/utility-config`,
      data
    );
    return response.data;
  },

  delete: async (apartmentId: string): Promise<void> => {
    await api.delete(`/apartments/${apartmentId}/utility-config`);
  },
};

export default apartmentsApi;
