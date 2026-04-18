import type { Room } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { ulid } from 'ulid';
import {
  createRoomRepository,
  type RoomRepository,
  type RoomWithApartment,
} from '../repositories/room.repo.js';
import {
  createApartmentRepository,
  type ApartmentRepository,
} from '../repositories/apartment.repo.js';
import { createAppError } from '../utils/appError.js';
import { toPrismaInputJsonValue } from '../utils/json.js';
import { NotFoundMessages } from '../messages.js';
import { prisma } from '../lib/prisma.js';
import { compareNaturalText } from '../utils/intuitiveSort.js';

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

/** 房间状态类型 */
export type RoomStatus = 'available' | 'occupied' | 'maintenance';

/** 带租约信息的房间（数据库查询返回） */
type RoomWithLeases = Room & {
  maintenance?: boolean;
  leases?: { is_active: boolean }[];
};

/**
 * 根据维护标记和租约计算房间状态
 */
function computeRoomStatus(room: RoomWithLeases): RoomStatus {
  // 优先判断维护状态
  if (room.maintenance) {
    return 'maintenance';
  }
  // 检查是否有活跃租约
  const hasActiveLease = room.leases && room.leases.some((lease) => lease.is_active);
  if (hasActiveLease) {
    return 'occupied';
  }
  return 'available';
}

/**
 * 创建房间输入
 */
export interface CreateRoomInput {
  apartment_id: string;
  room_number: string;
  layout?: string;
  area?: number;
  notes?: string;
  facilities?: RoomFacilities;
  monthly_rent?: number;
}

/**
 * 批量创建房间输入
 */
export interface BatchCreateRoomInput {
  room_numbers: string[];
  layout?: string;
  area?: number;
  notes?: string;
  monthly_rent?: number;
}

/**
 * 更新房间输入
 */
export interface UpdateRoomInput {
  room_number?: string;
  layout?: string;
  maintenance?: boolean;
  area?: number;
  notes?: string;
  facilities?: RoomFacilities | null;
  monthly_rent?: number;
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
    area: data.area,
    notes: data.notes,
    maintenance: false,
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
    maintenance: data.maintenance ?? existing.maintenance,
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
  getRepo: () => RoomRepository = () => createRoomRepository(prisma),
  getApartmentRepo: () => ApartmentRepository = () => createApartmentRepository(prisma)
): RoomService {
  const sortRooms = (rooms: Room[]) =>
    [...rooms].sort((left, right) => compareNaturalText(left.room_number, right.room_number));

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
      const apartment = await getApartmentRepo().findByIdAndOrg(apartmentId, orgId);
      if (!apartment) {
        throw createAppError(404, NotFoundMessages.APARTMENT);
      }
      const rooms = await getRepo().findByApartmentId(apartmentId) as RoomWithLeases[];
      // 计算每间房的状态
      const roomsWithComputedStatus = rooms.map((room) => ({
        ...room,
        status: computeRoomStatus(room),
      }));
      return sortRooms(roomsWithComputedStatus);
    },

    create: async (orgId: string, apartmentId: string, data: CreateRoomInput) => {
      // 验证公寓归属
      const apartment = await getApartmentRepo().findByIdAndOrg(apartmentId, orgId);
      if (!apartment) {
        throw createAppError(404, NotFoundMessages.APARTMENT);
      }
      const room = await getRepo().create(buildCreateData(apartmentId, data));

      // 创建房间定价（如果提供了月租）
      if (data.monthly_rent !== undefined) {
        await prisma.roomPricing.create({
          data: {
            id: ulid().toLowerCase(),
            room_id: room.id,
            monthly_rent: data.monthly_rent,
          },
        });
      }

      return room;
    },

    batchCreate: async (orgId: string, apartmentId: string, data: BatchCreateRoomInput) => {
      // 验证公寓归属
      const apartment = await getApartmentRepo().findByIdAndOrg(apartmentId, orgId);
      if (!apartment) {
        throw createAppError(404, NotFoundMessages.APARTMENT);
      }

      const roomsData = data.room_numbers.map((roomNumber) => {
        const createData: Prisma.RoomCreateInput = {
          id: ulid().toLowerCase(),
          apartment: { connect: { id: apartmentId } },
          room_number: roomNumber,
          layout: data.layout,
          area: data.area,
          notes: data.notes,
          maintenance: false,
        };
        return createData;
      });

      const rooms = await getRepo().createBatch(roomsData);

      // 为所有房间创建定价（如果提供了月租）
      if (data.monthly_rent !== undefined) {
        await Promise.all(
          rooms.map((room) =>
            prisma.roomPricing.create({
              data: {
                id: ulid().toLowerCase(),
                room_id: room.id,
                monthly_rent: data.monthly_rent!,
              },
            })
          )
        );
      }

      return rooms;
    },

    update: async (orgId: string, roomId: string, data: UpdateRoomInput) => {
      const existing = await getRepo().findByIdWithApartment(roomId);
      if (!existing || existing.apartment.organization_id !== orgId) {
        throw createAppError(404, NotFoundMessages.ROOM);
      }
      const updated = await getRepo().update(roomId, buildUpdateData(existing, data));

      // 处理月租更新
      if (data.monthly_rent !== undefined) {
        await prisma.roomPricing.upsert({
          where: { room_id: roomId },
          update: { monthly_rent: data.monthly_rent },
          create: {
            id: ulid().toLowerCase(),
            room_id: roomId,
            monthly_rent: data.monthly_rent,
          },
        });
      }

      // 获取带租约信息用于计算状态
      const roomWithLeases = await getRepo().findByIdWithLeases(roomId);
      return {
        ...updated,
        status: computeRoomStatus(roomWithLeases as RoomWithLeases),
      };
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
