import type { Apartment, Prisma } from '@prisma/client';
import { ulid } from 'ulid';
import {
  createApartmentRepository,
  calculateRoomStats,
  type ApartmentRepository,
  type ApartmentWithStats,
  type ApartmentWithRooms,
} from '../repositories/apartment.repo.js';
import { createAppError } from '../utils/appError.js';
import { NotFoundMessages } from '../messages.js';
import { prisma } from '../lib/prisma.js';

/**
 * 创建公寓输入
 */
export interface CreateApartmentInput {
  name: string;
  address?: string;
  description?: string;
}

/**
 * 更新公寓输入
 */
export interface UpdateApartmentInput {
  name?: string;
  address?: string;
  description?: string;
}

/**
 * Apartment Service 接口
 */
export interface ApartmentService {
  listByOrg(orgId: string): Promise<ApartmentWithStats[]>;
  getById(orgId: string, id: string): Promise<ApartmentWithRooms>;
  create(orgId: string, data: CreateApartmentInput): Promise<Apartment>;
  update(orgId: string, id: string, data: UpdateApartmentInput): Promise<Apartment>;
  delete(orgId: string, id: string): Promise<void>;
  validateOwnership(orgId: string, id: string): Promise<Apartment>;
}

/**
 * 构建公寓创建数据
 */
function buildCreateData(orgId: string, data: CreateApartmentInput): Prisma.ApartmentCreateInput {
  return {
    id: ulid().toLowerCase(),
    organization: { connect: { id: orgId } },
    name: data.name,
    address: data.address,
    description: data.description,
  };
}

/**
 * 构建公寓更新数据
 */
function buildUpdateData(
  existing: Apartment,
  data: UpdateApartmentInput
): Prisma.ApartmentUpdateInput {
  return {
    name: data.name ?? existing.name,
    address: data.address ?? existing.address,
    description: data.description ?? existing.description,
  };
}

/**
 * 创建 Apartment Service 实例
 */
export function createApartmentService(
  getRepo: () => ApartmentRepository = () => createApartmentRepository(prisma)
): ApartmentService {
  return {
    listByOrg: async (orgId: string) => {
      const apartments = await getRepo().findByOrgIdWithRooms(orgId);
      return apartments.map((apt) => ({
        ...apt,
        room_stats: calculateRoomStats(apt.rooms),
      }));
    },

    getById: async (orgId: string, id: string) => {
      const apartment = await getRepo().findByIdAndOrg(id, orgId);
      if (!apartment) {
        throw createAppError(404, NotFoundMessages.APARTMENT);
      }
      // 需要包含 rooms
      const withRooms = await prisma.apartment.findUnique({
        where: { id },
        include: { rooms: true },
      });
      return withRooms!;
    },

    create: async (orgId: string, data: CreateApartmentInput) => {
      return getRepo().create(buildCreateData(orgId, data));
    },

    update: async (orgId: string, id: string, data: UpdateApartmentInput) => {
      const existing = await getRepo().findByIdAndOrg(id, orgId);
      if (!existing) {
        throw createAppError(404, NotFoundMessages.APARTMENT);
      }
      return getRepo().update(id, buildUpdateData(existing, data));
    },

    delete: async (orgId: string, id: string) => {
      const existing = await getRepo().findByIdAndOrg(id, orgId);
      if (!existing) {
        throw createAppError(404, NotFoundMessages.APARTMENT);
      }
      await getRepo().delete(id);
    },

    validateOwnership: async (orgId: string, id: string) => {
      const apartment = await getRepo().findByIdAndOrg(id, orgId);
      if (!apartment) {
        throw createAppError(404, NotFoundMessages.APARTMENT);
      }
      return apartment;
    },
  };
}

/**
 * 默认 Apartment Service 实例
 */
export const defaultApartmentService = createApartmentService();
