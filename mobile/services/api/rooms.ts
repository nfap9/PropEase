import api from './client'
import type { Lease, Bill } from '@apartment-ultra/api-contract'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RoomData = any

// 内部定义更新数据类型
export interface UpdateRoomData {
  room_number?: string
  floor?: number
  monthly_rent?: number
  status?: 'available' | 'occupied' | 'maintenance'
  layout?: string
  area?: number
  notes?: string
}

export const roomsApi = {
  /**
   * 获取房间详情
   */
  get: async (id: string): Promise<RoomData> => {
    return api.get<RoomData>(`/apartments/rooms/${id}`)
  },

  /**
   * 更新房间
   */
  update: async (id: string, data: UpdateRoomData): Promise<RoomData> => {
    return api.put<RoomData>(`/apartments/rooms/${id}`, data)
  },

  /**
   * 删除房间
   */
  delete: async (id: string): Promise<void> => {
    return api.delete<void>(`/apartments/rooms/${id}`)
  },

  /**
   * 获取房间的租约列表
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getLeases: async (roomId: string): Promise<any[]> => {
    return api.get(`/apartments/rooms/${roomId}/leases`)
  },

  /**
   * 获取房间的账单列表
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getBills: async (roomId: string): Promise<any[]> => {
    return api.get(`/apartments/rooms/${roomId}/bills`)
  },
}

export default roomsApi
