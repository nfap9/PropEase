/**
 * useLoading - 统一处理接口 loading 状态
 * @param queryFn - 接口请求函数
 * @param options.queryKey - React Query 缓存 key，用于标识当前请求。相同 key 会复用缓存数据。
 *                           不传则每次组件重渲染生成随机 key（仅作状态获取用，无法缓存）。
 * @param options.auto - 是否自动调用接口，默认 false
 * @returns { loading, query }
 *   - loading: 接口是否正在请求
 *   - query: 手动触发请求的函数
 */
import { useState, useCallback } from 'react';
import { useQuery, UseQueryResult } from '@tanstack/react-query';

export function useLoading<TData = unknown, TError = unknown>(
  queryFn: () => Promise<TData>,
  options?: {
    /** React Query 缓存 key，相同 key 会复用缓存 */
    queryKey?: string[];
    /** 是否自动调用接口，默认 false */
    auto?: boolean;
  }
): {
  loading: boolean;
  query: () => void;
  result: UseQueryResult<TData, TError>;
} {
  const [queryKey] = useState(() => options?.queryKey ?? [Math.random()]);
  const auto = options?.auto ?? false;

  const query = useQuery<TData, TError>({
    queryKey,
    queryFn,
    enabled: auto,
  });

  const manualQuery = useCallback(() => {
    query.refetch();
  }, [query]);

  return {
    loading: query.isLoading,
    query: manualQuery,
    result: query,
  };
}
