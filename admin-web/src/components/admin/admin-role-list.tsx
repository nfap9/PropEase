
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import type { AdminRole } from '@/api/admin-client';
import { Plus, Trash2 } from 'lucide-react';
import { adminI18n, adminMessages } from '@/i18n';

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
    <div className="flex flex-col h-full">
      <div className="p-2 border-b">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={onAddRole}
          disabled={isLoading}
          data-testid="admin-roles-create-btn"
        >
          <Plus className="mr-2 h-4 w-4" />
          {adminMessages.roles.createButton}
        </Button>
      </div>
      <div className="flex-1 overflow-auto">
        {roles.map((role) => (
          <div
            key={role.id}
            className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-accent ${
              selectedRoleId === role.id ? 'bg-accent' : ''
            }`}
            onClick={() => onSelectRole(role)}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="truncate">{role.name}</span>
              {role.is_system && (
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {adminMessages.roles.builtin}
                </Badge>
              )}
            </div>
            {!role.is_system && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteRole(role);
                }}
                aria-label={adminI18n.t('roles.deleteAriaLabel', { name: role.name })}
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
