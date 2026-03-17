import api from './client'
import type { Bill, Lease, Room, RoomUpdate } from '@apartment-ultra/api-contract'

type RoomData = Room

export type UpdateRoomData = RoomUpdate

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
  getLeases: async (roomId: string): Promise<Lease[]> => {
    return api.get<Lease[]>(`/apartments/rooms/${roomId}/leases`)
  },

  /**
   * 获取房间的账单列表
   */
  getBills: async (roomId: string): Promise<Bill[]> => {
    return api.get<Bill[]>(`/apartments/rooms/${roomId}/bills`)
  },
}

export default roomsApi
