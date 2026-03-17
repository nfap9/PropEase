import type { Room } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { ulid } from 'ulid';
import {
  createRoomRepository,
  type RoomRepository,
  type RoomWithApartment,
} from '../repositories/room.repo.js';
import { createAppError } from '../utils/appError.js';
import { toPrismaInputJsonValue } from '../utils/json.js';
import { NotFoundMessages } from '../messages.js';
import { prisma } from '../lib/prisma.js';

/** 设施项 */
interface FacilityItem {
  code: string;
  quantity: number;
}

/** 房间设施配置 */
interface RoomFacilities {
  version: 1;
  furniture: FacilityItem[];
  appliances: FacilityItem[];
}

/**
 * 创建房间输入
 */
export interface CreateRoomInput {
  apartment_id: string;
  room_number: string;
  layout?: string;
  monthly_rent: number;
  area?: number;
  notes?: string;
  status?: 'available' | 'occupied' | 'maintenance';
  facilities?: RoomFacilities;
}

/**
 * 批量创建房间输入
 */
export interface BatchCreateRoomInput {
  room_numbers: string[];
  layout?: string;
  monthly_rent: number;
  area?: number;
  notes?: string;
}

/**
 * 更新房间输入
 */
export interface UpdateRoomInput {
  room_number?: string;
  layout?: string;
  status?: 'available' | 'occupied' | 'maintenance';
  monthly_rent?: number;
  area?: number;
  notes?: string;
  facilities?: RoomFacilities | null;
}

/**
 * Room Service 接口
 */
export interface RoomService {
  getById(orgId: string, roomId: string): Promise<RoomWithApartment>;
  listByApartment(orgId: string, apartmentId: string): Promise<Room[]>;
  create(orgId: string, apartmentId: string, data: CreateRoomInput): Promise<Room>;
  batchCreate(orgId: string, apartmentId: string, data: BatchCreateRoomInput): Promise<Room[]>;
  update(orgId: string, roomId: string, data: UpdateRoomInput): Promise<Room>;
  delete(orgId: string, roomId: string): Promise<void>;
  validateOwnership(orgId: string, roomId: string): Promise<RoomWithApartment>;
}

/**
 * 构建房间创建数据
 */
function buildCreateData(apartmentId: string, data: CreateRoomInput): Prisma.RoomCreateInput {
  return {
    id: ulid().toLowerCase(),
    apartment: { connect: { id: apartmentId } },
    room_number: data.room_number,
    layout: data.layout,
    monthly_rent: data.monthly_rent,
    area: data.area,
    notes: data.notes,
    status: data.status ?? 'available',
    facilities:
      data.facilities === undefined
        ? undefined
        : toPrismaInputJsonValue(data.facilities),
  };
}

/**
 * 构建房间更新数据
 */
function buildUpdateData(existing: Room, data: UpdateRoomInput): Prisma.RoomUpdateInput {
  const result: Prisma.RoomUpdateInput = {
    room_number: data.room_number ?? existing.room_number,
    layout: data.layout ?? existing.layout,
    status: data.status ?? existing.status,
    monthly_rent: data.monthly_rent ?? Number(existing.monthly_rent),
    area:
      data.area !== undefined
        ? data.area
        : existing.area != null
          ? Number(existing.area)
          : undefined,
    notes: data.notes ?? existing.notes,
  };

  if (data.facilities !== undefined) {
    if (data.facilities === null) {
      result.facilities = Prisma.JsonNull;
    } else {
      result.facilities = toPrismaInputJsonValue(data.facilities);
    }
  }

  return result;
}

/**
 * 创建 Room Service 实例
 */
export function createRoomService(
  getRepo: () => RoomRepository = () => createRoomRepository(prisma)
): RoomService {
  return {
    getById: async (orgId: string, roomId: string) => {
      const room = await getRepo().findByIdWithApartment(roomId);
      if (!room || room.apartment.organization_id !== orgId) {
        throw createAppError(404, NotFoundMessages.ROOM);
      }
      return room;
    },

    listByApartment: async (orgId: string, apartmentId: string) => {
      // 先验证公寓归属
      const apartment = await prisma.apartment.findFirst({
        where: { id: apartmentId, organization_id: orgId },
      });
      if (!apartment) {
        throw createAppError(404, NotFoundMessages.APARTMENT);
      }
      return getRepo().findByApartmentId(apartmentId);
    },

    create: async (orgId: string, apartmentId: string, data: CreateRoomInput) => {
      // 验证公寓归属
      const apartment = await prisma.apartment.findFirst({
        where: { id: apartmentId, organization_id: orgId },
      });
      if (!apartment) {
        throw createAppError(404, NotFoundMessages.APARTMENT);
      }
      return getRepo().create(buildCreateData(apartmentId, data));
    },

    batchCreate: async (orgId: string, apartmentId: string, data: BatchCreateRoomInput) => {
      // 验证公寓归属
      const apartment = await prisma.apartment.findFirst({
        where: { id: apartmentId, organization_id: orgId },
      });
      if (!apartment) {
        throw createAppError(404, NotFoundMessages.APARTMENT);
      }

      const roomsData = data.room_numbers.map((roomNumber) =>
        buildCreateData(apartmentId, {
          apartment_id: apartmentId,
          room_number: roomNumber,
          layout: data.layout,
          monthly_rent: data.monthly_rent,
          area: data.area,
          notes: data.notes,
          status: 'available',
        })
      );

      return getRepo().createBatch(roomsData);
    },

    update: async (orgId: string, roomId: string, data: UpdateRoomInput) => {
      const existing = await getRepo().findByIdWithApartment(roomId);
      if (!existing || existing.apartment.organization_id !== orgId) {
        throw createAppError(404, NotFoundMessages.ROOM);
      }
      return getRepo().update(roomId, buildUpdateData(existing, data));
    },

    delete: async (orgId: string, roomId: string) => {
      const existing = await getRepo().findByIdWithApartment(roomId);
      if (!existing || existing.apartment.organization_id !== orgId) {
        throw createAppError(404, NotFoundMessages.ROOM);
      }
      await getRepo().delete(roomId);
    },

    validateOwnership: async (orgId: string, roomId: string) => {
      const room = await getRepo().findByIdWithApartment(roomId);
      if (!room || room.apartment.organization_id !== orgId) {
        throw createAppError(404, NotFoundMessages.ROOM);
      }
      return room;
    },
  };
}

/**
 * 默认 Room Service 实例
 */
export const defaultRoomService = createRoomService();
