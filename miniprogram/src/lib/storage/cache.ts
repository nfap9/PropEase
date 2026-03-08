import Taro from '@tarojs/taro';

interface CacheItem<T> {
  data: T;
  expireAt: number;
}

const DEFAULT_EXPIRE = 5 * 60 * 1000; // 5分钟

/**
 * 数据缓存工具
 */
export const cache = {
  /**
   * 设置缓存
   */
  set<T>(key: string, data: T, expireMs: number = DEFAULT_EXPIRE): void {
    const item: CacheItem<T> = {
      data,
      expireAt: Date.now() + expireMs,
    };
    Taro.setStorageSync(key, JSON.stringify(item));
  },

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    const raw = Taro.getStorageSync(key);
    if (!raw) return null;

    try {
      const item: CacheItem<T> = JSON.parse(raw);
      if (Date.now() > item.expireAt) {
        Taro.removeStorageSync(key);
        return null;
      }
      return item.data;
    } catch {
      return null;
    }
  },

  /**
   * 移除缓存
   */
  remove(key: string): void {
    Taro.removeStorageSync(key);
  },

  /**
   * 清除所有缓存
   */
  clear(): void {
    Taro.clearStorageSync();
  },
};

/**
 * 缓存键常量
 */
export const CACHE_KEYS = {
  APARTMENTS: (orgId: string) => `cache_apartments_${orgId}`,
  ROOMS: (apartmentId: string) => `cache_rooms_${apartmentId}`,
  OVERVIEW: (orgId: string) => `cache_overview_${orgId}`,
  BILLS: (orgId: string, status?: string) => `cache_bills_${orgId}_${status || 'all'}`,
  UTILITIES: (orgId: string, yearMonth: string) => `cache_utilities_${orgId}_${yearMonth}`,
} as const;
