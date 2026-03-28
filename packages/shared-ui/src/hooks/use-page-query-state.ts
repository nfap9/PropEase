'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export interface PageQueryUpdateOptions {
  /** 本次更新使用 push 还是 replace。 */
  history?: 'push' | 'replace';
  /** 是否保持页面滚动位置。默认 `true`。 */
  scroll?: boolean;
}

export interface UsePageQueryStateOptions<TValue> {
  /** 查询参数名。 */
  queryKey: string;
  /** 参数缺失或非法时使用的默认值。 */
  defaultValue: TValue;
  /** 自定义解析逻辑。 */
  parse?: (rawValue: string | null) => TValue | null | undefined;
  /** 自定义序列化逻辑。 */
  serialize?: (value: TValue) => string | null | undefined;
  /** 默认使用 replace，避免筛选输入产生过长历史记录。 */
  history?: 'push' | 'replace';
  /** 当值等于默认值时，是否自动从 URL 中移除参数。 */
  clearOnDefault?: boolean;
  /** 默认更新后是否保持滚动位置。 */
  scroll?: boolean;
}

export interface UsePageQueryStateResult<TValue> {
  /** 当前查询参数对应的值。 */
  value: TValue;
  /** 更新查询参数。 */
  setValue: (nextValue: TValue | ((currentValue: TValue) => TValue), options?: PageQueryUpdateOptions) => void;
  /** 清空当前查询参数，恢复为默认值。 */
  clear: (options?: PageQueryUpdateOptions) => void;
}

/**
 * 管理页面 URL 查询参数中的单个状态。
 *
 * 适用于 Next App Router 的 client 页面，例如：
 * - 列表页状态筛选
 * - 标签页 / 分类切换
 * - 组织 ID、搜索词这类需要可分享 URL 的页面状态
 *
 * 设计目标：
 * - 让 URL 成为页面筛选状态的单一真源
 * - 统一处理“解析 / 序列化 / 清空默认值”
 * - 避免业务页面重复拼装 `URLSearchParams`
 *
 * 注意：
 * - 这是一个依赖 `next/navigation` 的 hook，只适用于 Next App Router client 组件
 * - 它只管理单个 query state，不负责接口请求和数据过滤逻辑
 */
export function usePageQueryState<TValue>({
  queryKey,
  defaultValue,
  parse,
  serialize,
  history = 'replace',
  clearOnDefault = true,
  scroll = true,
}: UsePageQueryStateOptions<TValue>): UsePageQueryStateResult<TValue> {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const value = React.useMemo(() => {
    const rawValue = searchParams.get(queryKey);
    const parsedValue = parse ? parse(rawValue) : ((rawValue as TValue | null) ?? undefined);

    if (parsedValue === null || parsedValue === undefined) {
      return defaultValue;
    }

    return parsedValue;
  }, [defaultValue, parse, queryKey, searchParams]);

  const setValue = React.useCallback(
    (nextValueOrUpdater: TValue | ((currentValue: TValue) => TValue), options?: PageQueryUpdateOptions) => {
      const nextValue =
        typeof nextValueOrUpdater === 'function'
          ? (nextValueOrUpdater as (currentValue: TValue) => TValue)(value)
          : nextValueOrUpdater;

      const params = new URLSearchParams(searchParams.toString());
      const serializedValue = serialize ? serialize(nextValue) : String(nextValue);
      const shouldClear =
        serializedValue === null ||
        serializedValue === undefined ||
        serializedValue === '' ||
        (clearOnDefault && Object.is(nextValue, defaultValue));

      if (shouldClear) {
        params.delete(queryKey);
      } else {
        params.set(queryKey, serializedValue);
      }

      const nextQuery = params.toString();
      const currentQuery = searchParams.toString();
      const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
      const currentUrl = currentQuery ? `${pathname}?${currentQuery}` : pathname;

      if (nextUrl === currentUrl) {
        return;
      }

      const nextHistory = options?.history ?? history;
      const nextScroll = options?.scroll ?? scroll;

      if (nextHistory === 'push') {
        router.push(nextUrl, { scroll: nextScroll });
        return;
      }

      router.replace(nextUrl, { scroll: nextScroll });
    },
    [clearOnDefault, defaultValue, history, pathname, queryKey, router, scroll, searchParams, serialize, value]
  );

  const clear = React.useCallback(
    (options?: PageQueryUpdateOptions) => {
      setValue(defaultValue, options);
    },
    [defaultValue, setValue]
  );

  return {
    value,
    setValue,
    clear,
  };
}
