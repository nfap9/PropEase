import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import Taro from '@tarojs/taro'
import type { User } from '@apartment-ultra/api-contract'

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  setToken: (token: string) => void
  setUser: (user: User) => void
  logout: () => void
  initialize: () => void
}

const storage = {
  getItem: (name: string) => {
    const value = Taro.getStorageSync(name)
    return value || null
  },
  setItem: (name: string, value: string) => {
    Taro.setStorageSync(name, value)
  },
  removeItem: (name: string) => {
    Taro.removeStorageSync(name)
  },
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setToken: (token) => {
        set({ token, isAuthenticated: !!token })
      },

      setUser: (user) => {
        set({ user })
      },

      logout: () => {
        Taro.removeStorageSync('access_token')
        Taro.removeStorageSync('user')
        set({ token: null, user: null, isAuthenticated: false })
      },

      initialize: () => {
        const token = Taro.getStorageSync('access_token')
        const userStr = Taro.getStorageSync('user')
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr)
            set({ token, user, isAuthenticated: true })
          } catch {
            set({ token: null, user: null, isAuthenticated: false })
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
