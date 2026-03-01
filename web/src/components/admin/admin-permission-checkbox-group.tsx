'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { getAdminPermissionGroups } from '@/lib/constants/admin-permissions';

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
 * 运营权限勾选组：按分组展示权限选项（仅中文），受控组件。
 * 单一职责：渲染权限勾选 UI，不关心数据来源与提交。
 */
export function AdminPermissionCheckboxGroup({
  value,
  onToggle,
  idPrefix,
  disabled = false,
  fullHeight = false,
}: AdminPermissionCheckboxGroupProps) {
  const groups = getAdminPermissionGroups();

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium leading-none">权限</p>
      <div
        className={
          fullHeight
            ? 'rounded-md border p-3 space-y-4'
            : 'rounded-md border p-3 space-y-4 max-h-64 overflow-y-auto'
        }
      >
        {Array.from(groups.entries()).map(([group, opts]) => (
          <div key={group}>
            <p className="text-sm font-medium text-muted-foreground mb-2">
              {group}
            </p>
            <div className="flex flex-wrap gap-4">
              {opts.map((opt) => (
                <div
                  key={opt.code}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={`${idPrefix}-${opt.code}`}
                    checked={
                      opt.code === '*'
                        ? value.includes('*')
                        : value.includes(opt.code)
                    }
                    onCheckedChange={(checked) =>
                      onToggle(opt.code, checked === true)
                    }
                    disabled={disabled}
                  />
                  <label
                    htmlFor={`${idPrefix}-${opt.code}`}
                    className="text-sm cursor-pointer select-none"
                  >
                    {opt.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
