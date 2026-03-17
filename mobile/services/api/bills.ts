import api from './client'
import type {
  Bill,
  BillCreate,
  BillListParams,
  BillUpdate,
  Payment,
  PaymentCreate,
} from '@apartment-ultra/api-contract'

export type { BillListParams };
export type BillWithDetails = Bill;

export const billsApi = {
  /**
   * 获取账单列表
   */
  list: async (params?: BillListParams): Promise<BillWithDetails[]> => {
    return api.get<BillWithDetails[]>('/bills', params as Record<string, unknown>)
  },

  /**
   * 获取账单详情
   */
  get: async (id: string): Promise<BillWithDetails> => {
    return api.get<BillWithDetails>(`/bills/${id}`)
  },

  /**
   * 创建账单
   */
  create: async (data: BillCreate): Promise<Bill> => {
    return api.post<Bill>('/bills', data)
  },

  /**
   * 更新账单
   */
  update: async (id: string, data: BillUpdate): Promise<Bill> => {
    return api.put<Bill>(`/bills/${id}`, data)
  },

  /**
   * 删除账单
   */
  delete: async (id: string): Promise<void> => {
    return api.delete<void>(`/bills/${id}`)
  },

  /**
   * 批量生成账单
   */
  generate: async (params: { bill_year: number; bill_month: number }): Promise<Bill[]> => {
    return api.post<Bill[]>('/bills/generate', params)
  },

  /**
   * 获取账单支付记录
   */
  getPayments: async (billId: string): Promise<Payment[]> => {
    return api.get<Payment[]>(`/bills/${billId}/payments`)
  },

  /**
   * 添加支付记录
   */
  addPayment: async (billId: string, data: PaymentCreate): Promise<Payment> => {
    return api.post<Payment>(`/bills/${billId}/payments`, data)
  },
}

export default billsApi
