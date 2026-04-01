import api from './client';
import type {
  OrgFeeItem,
  OrgFeeItemCreate,
  OrgFeeItemUpdate,
  FeeCycle,
  FeeCategory,
} from '@apartment-ultra/api-contract';

/**
 * 费用项目 API（新版 /fee-items）
 * 注意：新版 API 移除了 FeeSpecification 和 ApartmentFeeConfig 概念
 */

export const feeItemsApi = {
  list: async (orgId: string, params?: {
    category?: FeeCategory;
    cycle?: FeeCycle;
    search?: string;
  }): Promise<OrgFeeItem[]> => {
    const response = await api.get<OrgFeeItem[]>('/fee-items', {
      params: { org_id: orgId, ...params },
    });
    return response.data;
  },

  get: async (orgId: string, id: string): Promise<OrgFeeItem> => {
    const response = await api.get<OrgFeeItem>(`/fee-items/${id}`, {
      params: { org_id: orgId },
    });
    return response.data;
  },

  create: async (orgId: string, data: OrgFeeItemCreate): Promise<OrgFeeItem> => {
    const response = await api.post<OrgFeeItem>('/fee-items', data, {
      params: { org_id: orgId },
    });
    return response.data;
  },

  update: async (orgId: string, id: string, data: OrgFeeItemUpdate): Promise<OrgFeeItem> => {
    const response = await api.put<OrgFeeItem>(`/fee-items/${id}`, data, {
      params: { org_id: orgId },
    });
    return response.data;
  },

  delete: async (orgId: string, id: string): Promise<void> => {
    await api.delete(`/fee-items/${id}`, { params: { org_id: orgId } });
  },
};

/**
 * 兼容旧 API 的 feeTypesApi
 * @deprecated 请使用 feeItemsApi
 */
export const feeTypesApi = {
  list: async (orgId: string) => feeItemsApi.list(orgId),
  get: async (orgId: string, id: string) => feeItemsApi.get(orgId, id),
  create: async (orgId: string, data: any) => feeItemsApi.create(orgId, data),
  update: async (orgId: string, id: string, data: any) => feeItemsApi.update(orgId, id, data),
  delete: async (orgId: string, id: string) => feeItemsApi.delete(orgId, id),
  // 旧 API 有规格管理，新 API 已移除，返回空
  addSpecification: async () => { throw new Error('Specification not supported in new API'); },
  updateSpecification: async () => { throw new Error('Specification not supported in new API'); },
  deleteSpecification: async () => { throw new Error('Specification not supported in new API'); },
};

/**
 * 兼容旧 API 的 apartmentFeeConfigApi
 * @deprecated 新 API 已移除 ApartmentFeeConfig 概念
 */
export const apartmentFeeConfigApi = {
  list: async (orgId: string, apartmentId: string) => {
    // 新 API 中没有公寓级别费用配置，返回空数组
    console.warn('ApartmentFeeConfig is deprecated, use OrgFeeItem instead');
    return [];
  },
  get: async () => { throw new Error('ApartmentFeeConfig not supported in new API'); },
  create: async () => { throw new Error('ApartmentFeeConfig not supported in new API'); },
  update: async () => { throw new Error('ApartmentFeeConfig not supported in new API'); },
  delete: async () => { throw new Error('ApartmentFeeConfig not supported in new API'); },
};

/**
 * 账单费用明细 API
 * 新 API 中仍在使用，但结构可能不同
 */
export const billFeeItemsApi = {
  list: async (orgId: string, billId: string) => {
    const response = await api.get<any[]>(`/bills/${billId}/fee-items`, {
      params: { org_id: orgId },
    });
    return response.data;
  },
};
