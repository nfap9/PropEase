import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import * as SecureStore from 'expo-secure-store'
import { router } from 'expo-router'
import type { User, Organization } from '@apartment-ultra/api-contract'
import { authApi, organizationsApi } from '@/services/api'

// SecureStore 适配器
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(name)
    } catch {
      return null
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value)
    } catch {
      // ignore
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name)
    } catch {
      // ignore
    }
  },
}

interface AuthState {
  user: User | null
  organization: Organization | null
  organizations: Organization[]
  isAuthenticated: boolean
  isLoading: boolean

  // Actions
  login: (phone: string, password?: string, verificationCode?: string) => Promise<void>
  register: (phone: string, password: string, fullName: string, verificationCode: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User) => void
  setOrganization: (org: Organization) => void
  loadOrganizations: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      organization: null,
      organizations: [],
      isAuthenticated: false,
      isLoading: true,

      login: async (phone, password, verificationCode) => {
        const response = await authApi.login({
          phone,
          password,
          verification_code: verificationCode,
        })

        await SecureStore.setItemAsync('access_token', response.access_token)
        await SecureStore.setItemAsync('refresh_token', response.refresh_token)

        const user = await authApi.getMe()
        set({ user, isAuthenticated: true })

        // 加载组织
        await get().loadOrganizations()
      },

      register: async (phone, password, fullName, verificationCode) => {
        const response = await authApi.register({
          phone,
          password,
          full_name: fullName,
          verification_code: verificationCode,
        })

        await SecureStore.setItemAsync('access_token', response.access_token)
        await SecureStore.setItemAsync('refresh_token', response.refresh_token)

        const user = await authApi.getMe()
        set({ user, isAuthenticated: true })

        // 加载组织
        await get().loadOrganizations()
      },

      logout: async () => {
        try {
          await SecureStore.deleteItemAsync('access_token')
          await SecureStore.deleteItemAsync('refresh_token')
          await SecureStore.deleteItemAsync('current_organization_id')
        } catch {
          // ignore
        }

        set({
          user: null,
          organization: null,
          organizations: [],
          isAuthenticated: false,
        })

        router.replace('/login')
      },

      setUser: (user) => set({ user }),

      setOrganization: async (org) => {
        await SecureStore.setItemAsync('current_organization_id', org.id)
        set({ organization: org })
      },

      loadOrganizations: async () => {
        try {
          const orgs = await organizationsApi.list()
          set({ organizations: orgs || [] })

          if (orgs && orgs.length > 0) {
            const savedOrgId = await SecureStore.getItemAsync('current_organization_id')
            const org = savedOrgId
              ? orgs.find((o) => o.id === savedOrgId) || orgs[0]
              : orgs[0]

            await get().setOrganization(org)
          }
        } catch (error) {
          console.error('Failed to load organizations:', error)
        }
      },

      initialize: async () => {
        try {
          const token = await SecureStore.getItemAsync('access_token')
          if (token) {
            const user = await authApi.getMe()
            set({ user, isAuthenticated: true })
            await get().loadOrganizations()
          }
        } catch {
          // Token 无效或过期，清除状态
          try {
            await SecureStore.deleteItemAsync('access_token')
            await SecureStore.deleteItemAsync('refresh_token')
          } catch {
            // ignore
          }
        }
        set({ isLoading: false })
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        user: state.user,
        organization: state.organization,
        organizations: state.organizations,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export default useAuthStore
