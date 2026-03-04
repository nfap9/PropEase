import type { Tenant, Prisma } from '../generated/client/index.js';
import { ulid } from 'ulid';
import { createTenantRepository, type TenantRepository } from '../repositories/tenant.repo.js';
import { createAppError } from '../utils/appError.js';
import { NotFoundMessages } from '../messages.js';
import { prisma } from '../lib/prisma.js';

/**
 * 创建租客输入
 */
export interface CreateTenantInput {
  name: string;
  phone?: string;
  id_card?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  notes?: string;
}

/**
 * 更新租客输入
 */
export interface UpdateTenantInput {
  name?: string;
  phone?: string;
  id_card?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  notes?: string;
}

/**
 * 构建租客创建数据
 */
function buildCreateData(orgId: string, data: CreateTenantInput): Prisma.TenantCreateInput {
  return {
    id: ulid().toLowerCase(),
    organization: { connect: { id: orgId } },
    name: data.name,
    phone: data.phone,
    id_card: data.id_card,
    emergency_contact: data.emergency_contact,
    emergency_phone: data.emergency_phone,
    notes: data.notes,
  };
}

/**
 * 构建租客更新数据
 */
function buildUpdateData(existing: Tenant, data: UpdateTenantInput): Prisma.TenantUpdateInput {
  return {
    name: data.name ?? existing.name,
    phone: data.phone ?? existing.phone,
    id_card: data.id_card ?? existing.id_card,
    emergency_contact: data.emergency_contact ?? existing.emergency_contact,
    emergency_phone: data.emergency_phone ?? existing.emergency_phone,
    notes: data.notes ?? existing.notes,
  };
}

/**
 * Tenant Service 接口
 */
export interface TenantService {
  list(orgId: string, search?: string): Promise<Tenant[]>;
  getById(orgId: string, id: string): Promise<Tenant>;
  create(orgId: string, data: CreateTenantInput): Promise<Tenant>;
  update(orgId: string, id: string, data: UpdateTenantInput): Promise<Tenant>;
  delete(orgId: string, id: string): Promise<void>;
}

/**
 * 创建 Tenant Service 实例
 * @param getRepo - Repository 工厂函数，支持依赖注入
 */
export function createTenantService(
  getRepo: () => TenantRepository = () => createTenantRepository(prisma)
): TenantService {
  return {
    list: async (orgId: string, search?: string) => {
      return getRepo().findByOrgId(orgId, search);
    },

    getById: async (orgId: string, id: string) => {
      const tenant = await getRepo().findByIdAndOrg(id, orgId);
      if (!tenant) {
        throw createAppError(404, NotFoundMessages.TENANT);
      }
      return tenant;
    },

    create: async (orgId: string, data: CreateTenantInput) => {
      return getRepo().create(buildCreateData(orgId, data));
    },

    update: async (orgId: string, id: string, data: UpdateTenantInput) => {
      const existing = await getRepo().findByIdAndOrg(id, orgId);
      if (!existing) {
        throw createAppError(404, NotFoundMessages.TENANT);
      }
      return getRepo().update(id, buildUpdateData(existing, data));
    },

    delete: async (orgId: string, id: string) => {
      const existing = await getRepo().findByIdAndOrg(id, orgId);
      if (!existing) {
        throw createAppError(404, NotFoundMessages.TENANT);
      }
      await getRepo().delete(id);
    },
  };
}

/**
 * 默认 Tenant Service 实例
 */
export const defaultTenantService = createTenantService();
