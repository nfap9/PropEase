import api from './client';
import {
  Apartment,
  ApartmentWithStats,
  Room,
  RoomBatchCreate,
  RoomUpdate,
  ApartmentConfig,
  ApartmentConfigInput,
  ApartmentFeeItem,
  ApartmentFeeItemCreate,
  ApartmentFeeItemUpdate,
  CopyConfigInput,
  CopyConfigResult,
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

export const apartmentConfigApi = {
  get: async (apartmentId: string): Promise<ApartmentConfig> => {
    const response = await api.get<ApartmentConfig>(`/apartment-config/${apartmentId}/config`);
    return response.data;
  },

  createOrUpdate: async (
    apartmentId: string,
    data: ApartmentConfigInput
  ): Promise<ApartmentConfig> => {
    const response = await api.put<ApartmentConfig>(
      `/apartment-config/${apartmentId}/config`,
      data
    );
    return response.data;
  },

  update: async (
    apartmentId: string,
    data: ApartmentConfigInput
  ): Promise<ApartmentConfig> => {
    const response = await api.patch<ApartmentConfig>(
      `/apartment-config/${apartmentId}/config`,
      data
    );
    return response.data;
  },

  delete: async (apartmentId: string): Promise<void> => {
    await api.delete(`/apartment-config/${apartmentId}/config`);
  },
};

export const apartmentFeeItemApi = {
  list: async (apartmentId: string): Promise<ApartmentFeeItem[]> => {
    const response = await api.get<ApartmentFeeItem[]>(`/apartment-config/${apartmentId}/config/fee-items`);
    return response.data;
  },

  create: async (apartmentId: string, data: ApartmentFeeItemCreate): Promise<ApartmentFeeItem> => {
    const response = await api.post<ApartmentFeeItem>(`/apartment-config/${apartmentId}/config/fee-items`, data);
    return response.data;
  },

  update: async (apartmentId: string, id: string, data: ApartmentFeeItemUpdate): Promise<ApartmentFeeItem> => {
    const response = await api.put<ApartmentFeeItem>(`/apartment-config/${apartmentId}/config/fee-items/${id}`, data);
    return response.data;
  },

  delete: async (apartmentId: string, id: string): Promise<void> => {
    await api.delete(`/apartment-config/${apartmentId}/config/fee-items/${id}`);
  },
};

export const apartmentConfigApplyApi = {
  apply: async (apartmentId: string, data: CopyConfigInput): Promise<CopyConfigResult> => {
    const response = await api.post<CopyConfigResult>(`/apartment-config/${apartmentId}/config/apply`, data);
    return response.data;
  },
};

export default apartmentsApi;
