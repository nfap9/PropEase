/**
 * 存储键常量
 */
export const STORAGE_KEYS = {
  // 认证相关
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  CURRENT_ORG_ID: 'current_organization_id',

  // 用户偏好
  THEME: 'theme',
  LANGUAGE: 'language',

  // 缓存前缀
  CACHE_PREFIX: 'cache_',
} as const;
