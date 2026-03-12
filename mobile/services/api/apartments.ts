import api from './client'
import type { Apartment, Room } from '@apartment-ultra/api-contract'

// 内部定义创建/更新数据类型
export interface CreateApartmentData {
  name: string
  address?: string
  description?: string
}

export interface UpdateApartmentData {
  name?: string
  address?: string
  description?: string
}

export interface CreateRoomData {
  room_number: string
  floor?: number
  monthly_rent: number
  status?: 'available' | 'occupied' | 'maintenance'
}

export interface UpdateRoomData {
  room_number?: string
  floor?: number
  monthly_rent?: number
  status?: 'available' | 'occupied' | 'maintenance'
}

// 带统计的公寓类型
export interface ApartmentWithStats extends Apartment {
  room_count: number
  available_rooms: number
  occupied_rooms: number
  maintenance_rooms: number
  occupancy_rate: number
}

export const apartmentsApi = {
  /**
   * 获取公寓列表
   */
  list: async (): Promise<ApartmentWithStats[]> => {
    return api.get<ApartmentWithStats[]>('/apartments')
  },

  /**
   * 获取公寓详情
   */
  get: async (id: string): Promise<Apartment> => {
    return api.get<Apartment>(`/apartments/${id}`)
  },

  /**
   * 创建公寓
   */
  create: async (data: CreateApartmentData): Promise<Apartment> => {
    return api.post<Apartment>('/apartments', data)
  },

  /**
   * 更新公寓
   */
  update: async (id: string, data: UpdateApartmentData): Promise<Apartment> => {
    return api.put<Apartment>(`/apartments/${id}`, data)
  },

  /**
   * 删除公寓
   */
  delete: async (id: string): Promise<void> => {
    return api.delete<void>(`/apartments/${id}`)
  },

  /**
   * 获取公寓的房间列表
   */
  getRooms: async (apartmentId: string): Promise<Room[]> => {
    return api.get<Room[]>(`/apartments/${apartmentId}/rooms`)
  },

  /**
   * 创建房间
   */
  createRoom: async (apartmentId: string, data: CreateRoomData): Promise<Room> => {
    return api.post<Room>(`/apartments/${apartmentId}/rooms`, data)
  },

  /**
   * 批量创建房间
   */
  batchCreateRooms: async (apartmentId: string, rooms: CreateRoomData[]): Promise<Room[]> => {
    return api.post<Room[]>(`/apartments/${apartmentId}/rooms/batch`, { rooms })
  },

  /**
   * 获取房间详情
   */
  getRoom: async (roomId: string): Promise<Room> => {
    return api.get<Room>(`/apartments/rooms/${roomId}`)
  },

  /**
   * 更新房间
   */
  updateRoom: async (roomId: string, data: UpdateRoomData): Promise<Room> => {
    return api.put<Room>(`/apartments/rooms/${roomId}`, data)
  },

  /**
   * 删除房间
   */
  deleteRoom: async (roomId: string): Promise<void> => {
    return api.delete<void>(`/apartments/rooms/${roomId}`)
  },
}

export default apartmentsApi
