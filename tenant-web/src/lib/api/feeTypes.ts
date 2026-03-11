import api from './client';
import type {
  FeeType,
  FeeSpecification,
  FeeTypeCreate,
  FeeTypeUpdate,
  FeeSpecificationCreate,
  FeeSpecificationUpdate,
  ApartmentFeeConfig,
  ApartmentFeeConfigCreate,
  ApartmentFeeConfigUpdate,
  BillFeeItem,
} from '@apartment-ultra/api-contract';

export const feeTypesApi = {
  list: async (orgId: string): Promise<FeeType[]> => {
    const response = await api.get<FeeType[]>('/fee-types', {
      params: { org_id: orgId },
    });
    return response.data;
  },

  get: async (orgId: string, id: string): Promise<FeeType> => {
    const response = await api.get<FeeType>(`/fee-types/${id}`, {
      params: { org_id: orgId },
    });
    return response.data;
  },

  create: async (orgId: string, data: FeeTypeCreate): Promise<FeeType> => {
    const response = await api.post<FeeType>('/fee-types', data, {
      params: { org_id: orgId },
    });
    return response.data;
  },

  update: async (orgId: string, id: string, data: FeeTypeUpdate): Promise<FeeType> => {
    const response = await api.put<FeeType>(`/fee-types/${id}`, data, {
      params: { org_id: orgId },
    });
    return response.data;
  },

  delete: async (orgId: string, id: string): Promise<void> => {
    await api.delete(`/fee-types/${id}`, { params: { org_id: orgId } });
  },

  // 规格相关
  addSpecification: async (
    orgId: string,
    feeTypeId: string,
    data: FeeSpecificationCreate
  ): Promise<FeeSpecification> => {
    const response = await api.post<FeeSpecification>(
      `/fee-types/${feeTypeId}/specifications`,
      data,
      { params: { org_id: orgId } }
    );
    return response.data;
  },

  updateSpecification: async (
    orgId: string,
    specificationId: string,
    data: FeeSpecificationUpdate
  ): Promise<FeeSpecification> => {
    const response = await api.put<FeeSpecification>(
      `/fee-types/specifications/${specificationId}`,
      data,
      { params: { org_id: orgId } }
    );
    return response.data;
  },

  deleteSpecification: async (orgId: string, specificationId: string): Promise<void> => {
    await api.delete(`/fee-types/specifications/${specificationId}`, {
      params: { org_id: orgId },
    });
  },
};

export const apartmentFeeConfigApi = {
  list: async (orgId: string, apartmentId: string): Promise<ApartmentFeeConfig[]> => {
    const response = await api.get<ApartmentFeeConfig[]>(
      `/apartments/${apartmentId}/fee-configs`,
      { params: { org_id: orgId } }
    );
    return response.data;
  },

  get: async (
    orgId: string,
    apartmentId: string,
    configId: string
  ): Promise<ApartmentFeeConfig> => {
    const response = await api.get<ApartmentFeeConfig>(
      `/apartments/${apartmentId}/fee-configs/${configId}`,
      { params: { org_id: orgId } }
    );
    return response.data;
  },

  create: async (
    orgId: string,
    apartmentId: string,
    data: ApartmentFeeConfigCreate
  ): Promise<ApartmentFeeConfig> => {
    const response = await api.post<ApartmentFeeConfig>(
      `/apartments/${apartmentId}/fee-configs`,
      data,
      { params: { org_id: orgId } }
    );
    return response.data;
  },

  update: async (
    orgId: string,
    apartmentId: string,
    configId: string,
    data: ApartmentFeeConfigUpdate
  ): Promise<ApartmentFeeConfig> => {
    const response = await api.put<ApartmentFeeConfig>(
      `/apartments/${apartmentId}/fee-configs/${configId}`,
      data,
      { params: { org_id: orgId } }
    );
    return response.data;
  },

  delete: async (
    orgId: string,
    apartmentId: string,
    configId: string
  ): Promise<void> => {
    await api.delete(`/apartments/${apartmentId}/fee-configs/${configId}`, {
      params: { org_id: orgId },
    });
  },
};

export const billFeeItemsApi = {
  list: async (orgId: string, billId: string): Promise<BillFeeItem[]> => {
    const response = await api.get<BillFeeItem[]>(`/bills/${billId}/fee-items`, {
      params: { org_id: orgId },
    });
    return response.data;
  },
};
