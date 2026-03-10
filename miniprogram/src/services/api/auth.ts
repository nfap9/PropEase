import api from './client'
import type { TokenResponse, LoginCredentials } from '@apartment-ultra/api-contract'

export const authApi = {
  login: async (data: LoginCredentials): Promise<TokenResponse> => {
    const response = await api.post<TokenResponse>('/auth/login', data)
    return response.data.data
  },

  register: async (data: {
    phone: string
    password: string
    code: string
    name?: string
  }): Promise<TokenResponse> => {
    const response = await api.post<TokenResponse>('/auth/register', data)
    return response.data.data
  },

  sendSmsCode: async (phone: string): Promise<void> => {
    await api.post('/auth/send-code', { phone })
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me')
    return response.data.data
  },

  logout: async () => {
    await api.post('/auth/logout')
  },
}
