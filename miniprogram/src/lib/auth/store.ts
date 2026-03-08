import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Taro from '@tarojs/taro';
import type { User, Organization } from '@apartment-ultra/api-contract';

interface AuthState {
  user: User | null;
  organization: Organization | null;
  organizations: Organization[];

  setUser: (user: User | null) => void;
  setOrganization: (org: Organization | null) => void;
  setOrganizations: (orgs: Organization[]) => void;
  clear: () => void;
}

// Taro 存储适配器
const taroStorage = {
  getItem: (name: string): string | null => {
    const value = Taro.getStorageSync(name);
    return value || null;
  },
  setItem: (name: string, value: string): void => {
    Taro.setStorageSync(name, value);
  },
  removeItem: (name: string): void => {
    Taro.removeStorageSync(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      organization: null,
      organizations: [],

      setUser: (user) => set({ user }),
      setOrganization: (organization) => set({ organization }),
      setOrganizations: (organizations) => set({ organizations }),
      clear: () =>
        set({
          user: null,
          organization: null,
          organizations: [],
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => taroStorage),
      // 只持久化必要数据（token 通过 Taro.setStorageSync 单独存储）
      partialize: (state) => ({
        user: state.user,
        organization: state.organization,
      }),
    }
  )
);
