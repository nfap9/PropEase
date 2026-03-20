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
  // 基本信息
  floors?: number;
  land_area?: number;
  total_area?: number;
  // 上游信息
  landlord_name?: string;
  landlord_contact?: string;
  contract_start?: string;
  contract_end?: string;
  landlord_rent?: number;
  // 经营成本
  operating_cost?: number;
}

/**
 * 更新公寓输入
 */
export interface UpdateApartmentInput {
  name?: string;
  address?: string;
  description?: string;
  // 基本信息
  floors?: number;
  land_area?: number;
  total_area?: number;
  // 上游信息
  landlord_name?: string;
  landlord_contact?: string;
  contract_start?: string;
  contract_end?: string;
  landlord_rent?: number;
  // 经营成本
  operating_cost?: number;
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
    floors: data.floors,
    land_area: data.land_area,
    total_area: data.total_area,
    landlord_name: data.landlord_name,
    landlord_contact: data.landlord_contact,
    contract_start: data.contract_start ? new Date(data.contract_start) : undefined,
    contract_end: data.contract_end ? new Date(data.contract_end) : undefined,
    landlord_rent: data.landlord_rent,
    operating_cost: data.operating_cost,
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
    floors: data.floors ?? existing.floors,
    land_area: data.land_area ?? existing.land_area,
    total_area: data.total_area ?? existing.total_area,
    landlord_name: data.landlord_name ?? existing.landlord_name,
    landlord_contact: data.landlord_contact ?? existing.landlord_contact,
    contract_start:
      data.contract_start !== undefined
        ? data.contract_start
          ? new Date(data.contract_start)
          : null
        : existing.contract_start,
    contract_end:
      data.contract_end !== undefined
        ? data.contract_end
          ? new Date(data.contract_end)
          : null
        : existing.contract_end,
    landlord_rent: data.landlord_rent ?? existing.landlord_rent,
    operating_cost: data.operating_cost ?? existing.operating_cost,
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
      return apartments.map((apt): ApartmentWithStats => {
        const { land_area, total_area, landlord_rent, operating_cost, ...rest } = apt;
        return {
          ...rest,
          land_area: land_area != null ? Number(land_area) : null,
          total_area: total_area != null ? Number(total_area) : null,
          landlord_rent: landlord_rent != null ? Number(landlord_rent) : null,
          operating_cost: operating_cost != null ? Number(operating_cost) : null,
          room_stats: calculateRoomStats(apt.rooms),
        } as ApartmentWithStats;
      });
    },

    getById: async (orgId: string, id: string) => {
      const apartment = await getRepo().findByIdAndOrgWithRooms(id, orgId);
      if (!apartment) {
        throw createAppError(404, NotFoundMessages.APARTMENT);
      }
      const { land_area, total_area, landlord_rent, operating_cost, ...rest } = apartment;
      return {
        ...rest,
        land_area: land_area != null ? Number(land_area) : null,
        total_area: total_area != null ? Number(total_area) : null,
        landlord_rent: landlord_rent != null ? Number(landlord_rent) : null,
        operating_cost: operating_cost != null ? Number(operating_cost) : null,
      } as ApartmentWithRooms;
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
