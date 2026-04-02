'use client';

import { useState } from 'react';
import { Checkbox } from '@apartment-ultra/shared-ui/components/ui';
import { getAdminPermissionGroups } from '@/lib/constants/admin-permissions';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';

export interface AdminPermissionCheckboxGroupProps {
  /** 当前选中的权限码 */
  value: string[];
  /** 勾选变化回调：code, checked */
  onToggle: (code: string, checked: boolean) => void;
  /** 复选框 id 前缀，避免同一页多实例冲突 */
  idPrefix: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 为 true 时由父容器滚动，不限制内容高度 */
  fullHeight?: boolean;
}

/**
 * 运营权限勾选组：树形结构，每个模块可展开显示权限列表。无「全部权限」单项，勾选模块内全部即表示该模块全部权限。
 */
export function AdminPermissionCheckboxGroup({
  value,
  onToggle,
  idPrefix,
  disabled = false,
  fullHeight = false,
}: AdminPermissionCheckboxGroupProps) {
  const groups = getAdminPermissionGroups();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(groups.keys()));

  const toggleExpanded = (group: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const handleGroupCheck = (
    group: string,
    opts: { code: string; label: string }[],
    checked: boolean
  ) => {
    opts.forEach((opt) => onToggle(opt.code, checked));
  };

  const isGroupAllChecked = (opts: { code: string }[]) =>
    opts.length > 0 && opts.every((opt) => value.includes(opt.code));
  const isGroupSomeChecked = (opts: { code: string }[]) =>
    opts.some((opt) => value.includes(opt.code));

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium leading-none">权限</p>
      <div className={cn('rounded-md border', fullHeight ? 'p-3' : 'max-h-64 overflow-y-auto p-3')}>
        <ul className="space-y-0.5">
          {Array.from(groups.entries()).map(([group, opts]) => {
            const isOpen = expanded.has(group);
            const allChecked = isGroupAllChecked(opts);
            const someChecked = isGroupSomeChecked(opts);
            const groupCount = opts.filter((o) => value.includes(o.code)).length;
            return (
              <li key={group} className="rounded-md">
                <div className="flex items-center gap-2 py-1.5 pr-2">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(group)}
                    className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted/80"
                    aria-expanded={isOpen}
                    aria-label={isOpen ? '收起' : '展开'}
                  >
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  <Checkbox
                    id={`${idPrefix}-group-${group}`}
                    checked={allChecked}
                    onCheckedChange={(checked) => handleGroupCheck(group, opts, checked === true)}
                    disabled={disabled}
                    className={cn(
                      'shrink-0',
                      someChecked && !allChecked && 'data-[state=unchecked]:opacity-70'
                    )}
                  />
                  <label
                    htmlFor={`${idPrefix}-group-${group}`}
                    className="flex-1 cursor-pointer select-none py-0.5 text-sm font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {group}
                  </label>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {groupCount}/{opts.length}
                  </span>
                </div>
                {isOpen && (
                  <ul className="ml-2 space-y-0.5 border-l border-muted pb-1 pl-6">
                    {opts.map((opt) => (
                      <li
                        key={opt.code}
                        className="-ml-px flex items-center gap-2 border-b border-muted/50 py-1 pl-2 last:border-b-0"
                      >
                        <Checkbox
                          id={`${idPrefix}-${opt.code}`}
                          checked={value.includes(opt.code)}
                          onCheckedChange={(checked) => onToggle(opt.code, checked === true)}
                          disabled={disabled}
                          className="shrink-0"
                        />
                        <label
                          htmlFor={`${idPrefix}-${opt.code}`}
                          className="flex-1 cursor-pointer select-none text-sm"
                        >
                          {opt.label}
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
