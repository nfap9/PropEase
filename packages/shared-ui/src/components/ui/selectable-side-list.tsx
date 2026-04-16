
import * as React from 'react';

import { cn } from '../../lib/utils';

export interface SelectableSideListItem<TValue> {
  /** 列表项唯一标识，用于选中态判断。 */
  id: string;
  /** 列表项对应的值，会在选中时原样返回给调用方。 */
  value: TValue;
  /** 主标题。 */
  label: React.ReactNode;
  /** 次级说明。 */
  description?: React.ReactNode;
  /** 标签区域，适合内联 Badge。 */
  badge?: React.ReactNode;
  /** 右侧附加操作。 */
  trailing?: React.ReactNode;
  /** 是否禁用当前项。 */
  disabled?: boolean;
  /** 单项额外类名。 */
  className?: string;
}

export interface SelectableSideListProps<TValue> extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onSelect' | 'title'
> {
  /** 头部标题。 */
  title?: React.ReactNode;
  /** 头部说明。 */
  description?: React.ReactNode;
  /** 头部右侧或下方操作区。 */
  headerAction?: React.ReactNode;
  /** 列表项。 */
  items: SelectableSideListItem<TValue>[];
  /** 当前选中项 ID。 */
  selectedId: string | null;
  /** 选中列表项时触发。 */
  onSelect: (value: TValue) => void;
  /** 空状态内容。 */
  emptyState?: React.ReactNode;
  /** 列表容器类名。 */
  listClassName?: string;
  /** 单项公共类名。 */
  itemClassName?: string;
}

/**
 * 可选中的侧边列表。
 *
 * 适用于设置页、权限页、角色页这类“左侧选择列表 + 右侧详情面板”的场景。
 * 组件只负责列表结构、选中态和基础交互，不接管业务数据请求或右侧详情逻辑。
 */
export function SelectableSideList<TValue>({
  title,
  description,
  headerAction,
  items,
  selectedId,
  onSelect,
  emptyState,
  className,
  listClassName,
  itemClassName,
  ...props
}: SelectableSideListProps<TValue>) {
  return (
    <div className={cn('bg-muted/30 flex h-full flex-col border-r', className)} {...props}>
      {title || description || headerAction ? (
        <div className="space-y-2 border-b p-3">
          {title ? <div className="text-sm font-semibold">{title}</div> : null}
          {description ? <p className="text-muted-foreground text-xs">{description}</p> : null}
          {headerAction}
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="text-muted-foreground flex flex-1 items-center justify-center p-4 text-sm">
          {emptyState ?? '暂无可选项'}
        </div>
      ) : (
        <ul className={cn('flex-1 space-y-1 overflow-y-auto p-2', listClassName)}>
          {items.map((item) => {
            const isSelected = selectedId === item.id;

            return (
              <li key={item.id}>
                <div
                  role="button"
                  tabIndex={item.disabled ? -1 : 0}
                  aria-disabled={item.disabled || undefined}
                  onClick={() => {
                    if (!item.disabled) {
                      onSelect(item.value);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (item.disabled) {
                      return;
                    }

                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onSelect(item.value);
                    }
                  }}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                    item.disabled
                      ? 'cursor-not-allowed opacity-60'
                      : 'hover:bg-muted/80 focus-visible:ring-ring cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                    isSelected && !item.disabled && 'bg-muted font-medium',
                    itemClassName,
                    item.className
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-left">{item.label}</span>
                      {item.badge ? <span className="shrink-0">{item.badge}</span> : null}
                    </div>
                    {item.description ? (
                      <p className="text-muted-foreground truncate pt-0.5 text-xs">{item.description}</p>
                    ) : null}
                  </div>

                  {item.trailing ? (
                    <div
                      className="shrink-0"
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      {item.trailing}
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
