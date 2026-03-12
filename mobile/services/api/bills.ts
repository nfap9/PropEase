import api from './client'
import type { Bill, Payment } from '@apartment-ultra/api-contract'

// 内部定义创建/更新数据类型
export interface CreateBillData {
  lease_id: string
  bill_year: number
  bill_month: number
  rent_amount?: number
  water_usage?: number
  electricity_usage?: number
  other_fees?: number
  due_date?: string
}

export interface UpdateBillData {
  rent_amount?: number
  water_usage?: number
  electricity_usage?: number
  other_fees?: number
  due_date?: string
  status?: 'pending' | 'paid' | 'partial' | 'overdue'
}

export interface CreatePaymentData {
  amount: number
  payment_method?: string
  payment_date?: string
  remark?: string
}

export interface BillListParams {
  status?: 'pending' | 'partial' | 'paid' | 'overdue'
  lease_id?: string
  bill_year?: number
  bill_month?: number
  page?: number
  limit?: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BillWithDetails = any

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
  create: async (data: CreateBillData): Promise<Bill> => {
    return api.post<Bill>('/bills', data)
  },

  /**
   * 更新账单
   */
  update: async (id: string, data: UpdateBillData): Promise<Bill> => {
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
  addPayment: async (billId: string, data: CreatePaymentData): Promise<Payment> => {
    return api.post<Payment>(`/bills/${billId}/payments`, data)
  },
}

export default billsApi
