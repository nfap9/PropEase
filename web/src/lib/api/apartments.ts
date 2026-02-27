import api from './client';
import { Apartment, ApartmentWithStats, Room, RoomBatchCreate } from '@/types';

export const apartmentsApi = {
  list: async (orgId: number): Promise<ApartmentWithStats[]> => {
    const response = await api.get<ApartmentWithStats[]>('/apartments', { params: { org_id: orgId } });
    return response.data;
  },

  get: async (orgId: number, id: number): Promise<Apartment> => {
    const response = await api.get<Apartment>(`/apartments/${id}`, { params: { org_id: orgId } });
    return response.data;
  },

  create: async (orgId: number, data: Partial<Apartment>): Promise<Apartment> => {
    const response = await api.post<Apartment>('/apartments', data, { params: { org_id: orgId } });
    return response.data;
  },

  update: async (orgId: number, id: number, data: Partial<Apartment>): Promise<Apartment> => {
    const response = await api.put<Apartment>(`/apartments/${id}`, data, { params: { org_id: orgId } });
    return response.data;
  },

  delete: async (orgId: number, id: number): Promise<void> => {
    await api.delete(`/apartments/${id}`, { params: { org_id: orgId } });
  },
};

export const roomsApi = {
  list: async (orgId: number, apartmentId: number): Promise<Room[]> => {
    const response = await api.get<Room[]>(`/apartments/${apartmentId}/rooms`, {
      params: { org_id: orgId },
    });
    return response.data;
  },

  // 获取组织内所有房间（跨公寓）
  listAll: async (orgId: number, apartmentIds: number[]): Promise<Room[]> => {
    const roomPromises = apartmentIds.map((aptId) =>
      api.get<Room[]>(`/apartments/${aptId}/rooms`, { params: { org_id: orgId } })
    );
    const responses = await Promise.all(roomPromises);
    return responses.flatMap((res) => res.data);
  },

  get: async (orgId: number, id: number): Promise<Room> => {
    const response = await api.get<Room>(`/rooms/${id}`, { params: { org_id: orgId } });
    return response.data;
  },

  create: async (orgId: number, data: Partial<Room>): Promise<Room> => {
    const response = await api.post<Room>('/rooms', data, { params: { org_id: orgId } });
    return response.data;
  },

  batchCreate: async (orgId: number, apartmentId: number, data: RoomBatchCreate): Promise<Room[]> => {
    const response = await api.post<Room[]>(`/apartments/${apartmentId}/rooms/batch`, data, {
      params: { org_id: orgId },
    });
    return response.data;
  },

  update: async (orgId: number, id: number, data: Partial<Room>): Promise<Room> => {
    const response = await api.put<Room>(`/rooms/${id}`, data, { params: { org_id: orgId } });
    return response.data;
  },

  delete: async (orgId: number, id: number): Promise<void> => {
    await api.delete(`/rooms/${id}`, { params: { org_id: orgId } });
  },
};

export default apartmentsApi;
