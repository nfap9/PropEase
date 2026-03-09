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
 * 测试数据生成器
 *
 * 用于在测试中动态创建独立的测试数据
 */

export interface TestDataOptions {
  /** 公寓名称前缀，默认使用时间戳 */
  prefix?: string;
  /** 强制使用的组织 ID（优先级高于自动获取） */
  orgId?: string;
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
 * 使用时间戳 + 随机数确保并行测试时的唯一性
 */
function generatePrefix(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `E2E_${timestamp}_${random}`;
}

/**
 * 测试数据生成器类
 */
export class TestDataGenerator {
  private api: ApiHelper;
  private request: APIRequestContext;
  private prefix: string;
  private forcedOrgId: string | null = null;
  private orgId: string | null = null;
  private createdResources: {
    apartments: string[];
    tenants: string[];
    leases: string[];
    feeTypes: string[];
    bills: string[];
  };

  constructor(request: APIRequestContext, options?: TestDataOptions) {
    this.api = new ApiHelper(request);
    this.request = request;
    this.prefix = options?.prefix || generatePrefix();
    this.forcedOrgId = options?.orgId || null;
    this.createdResources = {
      apartments: [],
      tenants: [],
      leases: [],
      feeTypes: [],
      bills: [],
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

    // 如果已强制指定组织 ID，直接使用
    if (this.forcedOrgId) {
      this.orgId = this.forcedOrgId;
      this.api.setOrgId(this.orgId);
      return;
    }

    // 获取用户的组织 ID - 优先使用个人组织
    try {
      const personalOrg = await this.api.getRaw<{ code: number; data: { id: string } }>('/api/v1/organizations/personal');
      if (personalOrg.code === 0 && personalOrg.data?.id) {
        this.orgId = personalOrg.data.id;
        this.api.setOrgId(this.orgId);
        return;
      }
    } catch (e) {
      console.log('Failed to get personal org:', e);
    }

    // 如果没有个人组织，尝试获取用户的第一个组织
    const orgs = await this.api.getRaw<{ code: number; data: { id: string }[] }>('/api/v1/organizations');
    if (orgs.code === 0 && orgs.data && orgs.data.length > 0) {
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
   * 同步组织 ID（在测试中从页面 localStorage 获取后调用）
   */
  setOrgId(orgId: string): void {
    this.orgId = orgId;
    this.api.setOrgId(orgId);
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

    // 创建公寓成功

    const rooms: CreatedRoom[] = [];

    // 生成唯一后缀（时间戳后4位 + 随机字符）
    const uniqueSuffix = Date.now().toString().slice(-4);

    // 创建房间
    for (let i = 1; i <= roomCount; i++) {
      // 使用唯一房间号格式：R + 后缀 + 序号，如 R7890_1
      const roomNumber = `R${uniqueSuffix}_${i}`;
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
    // 使用更长的随机数确保唯一性
    const uniqueSuffix = Date.now().toString().slice(-8) + Math.random().toString(36).substring(2, 4);

    const tenant = await this.api.post<{ id: string; name: string }>('/api/v1/tenants', {
      name: tenantName,
      phone: `139${uniqueSuffix}`,
      id_card: `1101011990${uniqueSuffix.slice(0, 6)}`,
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
   * 创建费用类型
   */
  async createFeeType(name?: string): Promise<{ id: string; name: string }> {
    const feeTypeName = name || `${this.prefix}_费用类型`;
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const code = `${this.prefix}_${randomSuffix}`;

    const feeType = await this.api.post<{ id: string; name: string }>('/api/v1/fee-types', {
      name: feeTypeName,
      code: code,
    });

    this.createdResources.feeTypes.push(feeType.id);

    return feeType;
  }

  /**
   * 创建账单（需要先有租约）
   */
  async createBill(
    leaseId: string,
    options?: {
      rent_amount?: number;
      water_amount?: number;
      electricity_amount?: number;
      other_amount?: number;
      total_amount?: number;
      bill_year?: number;
      bill_month?: number;
      due_date?: string;
      notes?: string;
    }
  ): Promise<{ id: string }> {
    const now = new Date();
    const billYear = options?.bill_year || now.getFullYear();
    const billMonth = options?.bill_month || now.getMonth() + 1;
    const rentAmount = options?.rent_amount ?? 1500;
    const totalAmount = options?.total_amount ?? rentAmount;

    const bill = await this.api.post<{ id: string }>('/api/v1/bills', {
      lease_id: leaseId,
      bill_year: billYear,
      bill_month: billMonth,
      rent_amount: rentAmount,
      water_amount: options?.water_amount ?? 0,
      electricity_amount: options?.electricity_amount ?? 0,
      other_amount: options?.other_amount ?? 0,
      total_amount: totalAmount,
      due_date: options?.due_date || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: options?.notes,
    });

    this.createdResources.bills.push(bill.id);

    return bill;
  }

  /**
   * 创建完整的测试环境（公寓、房间、租客、租约）
   * 用于需要账单、付款等依赖租约的测试
   */
  async createFullTestEnvironment(): Promise<{
    apartment: CreatedApartment;
    tenant: CreatedTenant;
    lease: { id: string };
  }> {
    const apartment = await this.createApartmentWithRooms(1);
    const tenant = await this.createTenant();
    const lease = await this.createLease(apartment.rooms[0].id, tenant.id);

    return { apartment, tenant, lease };
  }

  /**
   * 清理所有创建的资源
   */
  async cleanup(): Promise<void> {
    // 先删除账单
    for (const billId of this.createdResources.bills) {
      try {
        await this.api.delete(`/api/v1/bills/${billId}`);
      } catch {
        // 忽略删除错误
      }
    }

    // 删除租约
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

    // 删除费用类型
    for (const feeTypeId of this.createdResources.feeTypes) {
      try {
        await this.api.delete(`/api/v1/fee-types/${feeTypeId}`);
      } catch {
        // 忽略删除错误
      }
    }

    this.createdResources = {
      apartments: [],
      tenants: [],
      leases: [],
      feeTypes: [],
      bills: [],
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
