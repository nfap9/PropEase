import { APIRequestContext } from '@playwright/test';
import { ApiHelper, apiLogin } from './api';

/**
 * E2E 测试用户配置（与 seedE2E.ts 保持同步）
 */
const E2E_TEST_USER = {
  phone: '13800138000',
  password: 'Test1234',
};

/**
 * API 响应包装格式
 */
interface ApiResponse<T> {
  code: number;
  data: T;
  message?: string;
}

/**
 * 测试数据生成器
 *
 * 用于在测试中动态创建独立的测试数据
 */

export interface TestDataOptions {
  /** 公寓名称前缀，默认使用时间戳 */
  prefix?: string;
}

export interface CreatedApartment {
  id: string;
  name: string;
  rooms: CreatedRoom[];
}

export interface CreatedRoom {
  id: string;
  room_number: string;
  status: string;
}

export interface CreatedTenant {
  id: string;
  name: string;
}

export interface TestDataContext {
  apartment: CreatedApartment;
  rooms: CreatedRoom[];
  tenants: CreatedTenant[];
}

/**
 * 生成唯一标识符
 */
function generatePrefix(): string {
  return `E2E_${Date.now()}`;
}

/**
 * 测试数据生成器类
 */
export class TestDataGenerator {
  private api: ApiHelper;
  private request: APIRequestContext;
  private prefix: string;
  private orgId: string | null = null;
  private createdResources: {
    apartments: string[];
    tenants: string[];
    leases: string[];
  };

  constructor(request: APIRequestContext, prefix?: string) {
    this.api = new ApiHelper(request);
    this.request = request;
    this.prefix = prefix || generatePrefix();
    this.createdResources = {
      apartments: [],
      tenants: [],
      leases: [],
    };
  }

  /**
   * 初始化 - 登录并设置 token 和组织 ID
   */
  async init(): Promise<void> {
    const { accessToken } = await apiLogin(
      this.request,
      E2E_TEST_USER.phone,
      E2E_TEST_USER.password
    );
    this.api.setToken(accessToken);

    // 获取用户的组织 ID - 通过查询用户所属组织
    const orgs = await this.api.getRaw<{ code: number; data: { id: string }[] }>('/api/v1/organizations');
    if (orgs.data && orgs.data.length > 0) {
      this.orgId = orgs.data[0].id;
      this.api.setOrgId(this.orgId);
    }
  }

  /**
   * 获取创建的公寓名称
   */
  getApartmentName(): string {
    return `${this.prefix}_公寓`;
  }

  /**
   * 获取 API 实例（用于特殊查询）
   */
  getApi(): ApiHelper {
    return this.api;
  }

  /**
   * 创建公寓和房间
   */
  async createApartmentWithRooms(
    roomCount: number = 3,
    options?: { apartmentName?: string }
  ): Promise<CreatedApartment> {
    const apartmentName = options?.apartmentName || `${this.prefix}_公寓`;

    // 创建公寓
    const apartment = await this.api.post<{ id: string; name: string }>('/api/v1/apartments', {
      name: apartmentName,
      address: `${this.prefix}_测试地址`,
    });

    const rooms: CreatedRoom[] = [];

    // 创建房间
    for (let i = 1; i <= roomCount; i++) {
      const roomNumber = `${i}01`;
      const room = await this.api.post<{ id: string; room_number: string; status: string }>(
        `/api/v1/apartments/${apartment.id}/rooms`,
        {
          room_number: roomNumber,
          monthly_rent: 1000 + i * 100,
          status: 'available',
        }
      );
      rooms.push({
        id: room.id,
        room_number: room.room_number,
        status: room.status,
      });
    }

    this.createdResources.apartments.push(apartment.id);

    return {
      id: apartment.id,
      name: apartment.name,
      rooms,
    };
  }

  /**
   * 创建租客
   */
  async createTenant(name?: string): Promise<CreatedTenant> {
    const tenantName = name || `${this.prefix}_租客`;
    const timestamp = Date.now();

    const tenant = await this.api.post<{ id: string; name: string }>('/api/v1/tenants', {
      name: tenantName,
      phone: `139${timestamp.toString().slice(-8)}`,
      id_card: `1101011990${timestamp.toString().slice(-6)}`,
    });

    this.createdResources.tenants.push(tenant.id);

    return {
      id: tenant.id,
      name: tenant.name,
    };
  }

  /**
   * 创建租约
   */
  async createLease(
    roomId: string,
    tenantId: string,
    options?: {
      monthlyRent?: number;
      startDate?: string;
    }
  ): Promise<{ id: string }> {
    const lease = await this.api.post<{ id: string }>('/api/v1/leases', {
      room_id: roomId,
      tenant_id: tenantId,
      start_date: options?.startDate || new Date().toISOString().split('T')[0],
      rental_type: 'monthly',
      billing_day: 1,
      monthly_rent: options?.monthlyRent || 1500,
      deposit: 1500,
    });

    this.createdResources.leases.push(lease.id);

    return lease;
  }

  /**
   * 终止租约
   */
  async terminateLease(leaseId: string): Promise<void> {
    await this.api.post(`/api/v1/leases/${leaseId}/terminate`, {
      end_date: new Date().toISOString().split('T')[0],
    });
  }

  /**
   * 清理所有创建的资源
   */
  async cleanup(): Promise<void> {
    // 先删除租约
    for (const leaseId of this.createdResources.leases) {
      try {
        await this.api.delete(`/api/v1/leases/${leaseId}`);
      } catch {
        // 忽略删除错误
      }
    }

    // 删除租客
    for (const tenantId of this.createdResources.tenants) {
      try {
        await this.api.delete(`/api/v1/tenants/${tenantId}`);
      } catch {
        // 忽略删除错误
      }
    }

    // 删除公寓（会级联删除房间）
    for (const apartmentId of this.createdResources.apartments) {
      try {
        await this.api.delete(`/api/v1/apartments/${apartmentId}`);
      } catch {
        // 忽略删除错误
      }
    }

    this.createdResources = {
      apartments: [],
      tenants: [],
      leases: [],
    };
  }
}

/**
 * 创建测试数据生成器实例
 */
export async function createTestDataGenerator(request: APIRequestContext): Promise<TestDataGenerator> {
  const generator = new TestDataGenerator(request);
  await generator.init();
  return generator;
}
