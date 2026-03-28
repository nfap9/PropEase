import * as React from 'react';

/**
 * 列表筛选状态 hook 的返回结构。
 *
 * 适用于列表页里常见的：
 * - `filters`
 * - `setFilters`
 * - `setFilter('keyword', value)`
 * - `resetFilters()`
 */
export interface UseListFiltersResult<TFilters> {
  filters: TFilters;
  setFilters: React.Dispatch<React.SetStateAction<TFilters>>;
  setFilter: <K extends keyof TFilters>(key: K, value: TFilters[K]) => void;
  patchFilters: (patch: Partial<TFilters>) => void;
  replaceFilters: (nextFilters: TFilters) => void;
  resetFilters: () => void;
}

/**
 * 管理列表页中的筛选状态。
 *
 * 这个 hook 只负责“筛选对象本身”的 UI 状态，不负责：
 * - URL 同步
 * - 请求参数拼装
 * - 业务查询逻辑
 *
 * 设计目标：
 * - 统一管理列表页的筛选对象
 * - 给页面提供稳定的 `setFilter / patchFilters / resetFilters`
 * - 减少散落的 `setState((prev) => ({ ...prev, ... }))`
 *
 * @typeParam TFilters 筛选对象类型
 * @param initialFilters 初始筛选对象，支持直接传值或 lazy initializer
 * @returns 当前筛选对象和一组常用更新方法
 *
 * @example
 * ```tsx
 * const leaseFilters = useListFilters(getDefaultLeaseFilters);
 *
 * leaseFilters.setFilter('keyword', 'A-101');
 * leaseFilters.resetFilters();
 * ```
 */
export function useListFilters<TFilters>(initialFilters: TFilters | (() => TFilters)): UseListFiltersResult<TFilters> {
  const initialFiltersRef = React.useRef<TFilters | null>(null);

  if (initialFiltersRef.current === null) {
    initialFiltersRef.current =
      typeof initialFilters === 'function' ? (initialFilters as () => TFilters)() : initialFilters;
  }

  const [filters, setFilters] = React.useState<TFilters>(initialFiltersRef.current);

  const setFilter = React.useCallback(<K extends keyof TFilters>(key: K, value: TFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  }, []);

  const patchFilters = React.useCallback((patch: Partial<TFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
  }, []);

  const replaceFilters = React.useCallback((nextFilters: TFilters) => {
    setFilters(nextFilters);
  }, []);

  const resetFilters = React.useCallback(() => {
    setFilters(initialFiltersRef.current!);
  }, []);

  return {
    filters,
    setFilters,
    setFilter,
    patchFilters,
    replaceFilters,
    resetFilters,
  };
}
