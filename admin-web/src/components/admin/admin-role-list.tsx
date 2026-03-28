'use client';

import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import type { AdminRole } from '@/lib/api/admin-client';
import { cn } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';

export interface AdminRoleListProps {
  roles: AdminRole[];
  selectedRoleId: string | null;
  onSelectRole: (role: AdminRole) => void;
  onAddRole: () => void;
  onDeleteRole: (role: AdminRole) => void;
  isLoading?: boolean;
}

/**
 * 运营角色列表（左侧栏）：展示角色名称、系统预置标签，支持选择与删除。
 */
export function AdminRoleList({
  roles,
  selectedRoleId,
  onSelectRole,
  onAddRole,
  onDeleteRole,
  isLoading,
}: AdminRoleListProps) {
  return (
    <div className="flex h-full flex-col border-r bg-muted/30">
      <div className="border-b p-3">
        <h2 className="mb-2 text-sm font-semibold" data-testid="admin-roles-heading">分工设置</h2>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={onAddRole}
          disabled={isLoading}
          data-testid="admin-roles-create-btn"
        >
          <Plus className="mr-2 h-4 w-4" />
          新建分工
        </Button>
      </div>
      <ul className="flex-1 space-y-1 overflow-y-auto p-2">
        {roles.map((role) => (
          <li key={role.id}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => onSelectRole(role)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectRole(role);
                }
              }}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                'hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                selectedRoleId === role.id && 'bg-muted font-medium'
              )}
            >
              <span className="flex-1 truncate text-left">{role.name}</span>
              {role.is_system && (
                <Badge variant="secondary" className="shrink-0 text-xs">
                  内置
                </Badge>
              )}
              {!role.is_system && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteRole(role);
                  }}
                  aria-label={`删除分工 ${role.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
