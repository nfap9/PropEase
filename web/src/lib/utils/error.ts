import { ApiError } from '@/lib/api/client';
import type { AxiosError } from 'axios';

/** 统一格式错误体 */
interface ErrorResponseData {
  message?: string;
  data?: { errors?: Array<{ field?: string; message?: string }> };
}

/**
 * 从错误对象中提取用户可读的错误信息。
 * 优先使用接口响应的 message，其次为 data.errors 首条，最后为 fallback。
 *
 * @param error - 捕获的错误（ApiError、AxiosError 或任意）
 * @param fallback - 无法提取时的默认提示
 * @returns 用于展示的错误文案
 */
export function getErrorMessage(error: unknown, fallback = '操作失败，请重试'): string {
  // ApiError：业务端已从接口解包，message 即接口响应的 message
  if (error instanceof ApiError && error.message) {
    return error.message;
  }

  // AxiosError：尝试从 response.data 提取
  if (error && typeof error === 'object' && 'response' in error) {
    const res = (error as AxiosError<ErrorResponseData>).response?.data;
    if (res && typeof res === 'object') {
      if (typeof res.message === 'string' && res.message) {
        return res.message;
      }
      const firstFieldError = res.data?.errors?.[0]?.message;
      if (typeof firstFieldError === 'string' && firstFieldError) {
        return firstFieldError;
      }
    }
  }

  // 普通 Error
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
