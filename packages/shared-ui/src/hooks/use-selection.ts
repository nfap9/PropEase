import * as React from 'react';

/**
 * 通用“当前选中项”状态的返回结构。
 *
 * 适用于表格选中行、当前编辑对象、当前激活卡片等场景。
 */
export interface UseSelectionResult<T> {
  selected: T | null;
  setSelected: React.Dispatch<React.SetStateAction<T | null>>;
  select: (value: T) => void;
  clear: () => void;
}

/**
 * 管理一个“当前选中项”。
 *
 * 适用场景：
 * - 列表页中记录当前选中的用户、计划、账单等实体
 * - 编辑、删除、查看详情前先缓存当前操作对象
 *
 * 相比零散地写 `const [selectedXxx, setSelectedXxx] = useState(...)`，
 * 这个 hook 统一提供了 `select / clear` 语义化 API，便于在多个页面复用。
 *
 * @typeParam T 被选中对象的类型
 * @param initialValue 初始选中值，默认 `null`
 * @returns 当前选中项及控制方法
 *
 * @example
 * ```tsx
 * const userSelection = useSelection<AdminUser>();
 *
 * userSelection.select(user);
 * userSelection.clear();
 * ```
 */
export function useSelection<T>(initialValue: T | null = null): UseSelectionResult<T> {
  const [selected, setSelected] = React.useState<T | null>(initialValue);

  return {
    selected,
    setSelected,
    select: (value) => setSelected(value),
    clear: () => setSelected(null),
  };
}
