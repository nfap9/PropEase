'use client';

import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { SelectableSideList } from '@apartment-ultra/shared-ui/components/ui';
import type { AdminRole } from '@/lib/api/admin-client';
import { Plus, Trash2 } from 'lucide-react';
import { adminI18n, adminMessages } from '@/lib/i18n';

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
  const items = roles.map((role) => ({
    id: role.id,
    value: role,
    label: role.name,
    badge: role.is_system ? (
      <Badge variant="secondary" className="shrink-0 text-xs">
        {adminMessages.roles.builtin}
      </Badge>
    ) : null,
    trailing: !role.is_system ? (
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={() => onDeleteRole(role)}
        aria-label={adminI18n.t('roles.deleteAriaLabel', { name: role.name })}
      >
        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    ) : null,
  }));

  return (
    <SelectableSideList
      title={<span data-testid="admin-roles-heading">{adminMessages.roles.heading}</span>}
      headerAction={
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
      }
      items={items}
      selectedId={selectedRoleId}
      onSelect={onSelectRole}
    />
  );
}
