import { useState } from 'react';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { cn } from '@/utils';
import { tenantMessages } from '@/i18n';
import type { OrgRole } from '@/api/permissions';

export interface OrgRoleListProps {
  roles: OrgRole[];
  selectedRoleId: string | null;
  onSelectRole: (role: OrgRole) => void;
  onAddRole: () => void;
  onDeleteRole: (role: OrgRole) => void;
}

export function OrgRoleList({
  roles,
  selectedRoleId,
  onSelectRole,
  onAddRole,
  onDeleteRole,
}: OrgRoleListProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium text-muted-foreground">
          {tenantMessages.settings.team.labels.teamRoles}
        </span>
        <Button size="sm" variant="outline" onClick={onAddRole}>
          {tenantMessages.settings.team.actions.addRole || '新增角色'}
        </Button>
      </div>
      <div className="space-y-1">
        {roles.map((role) => (
          <div
            key={role.id}
            className="group flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted/50"
          >
            <button
              onClick={() => onSelectRole(role)}
              className={cn(
                'flex-1 text-left',
                selectedRoleId === role.id
                  ? 'font-medium text-primary'
                  : 'text-muted-foreground'
              )}
            >
              {role.name}
              {role.is_system && (
                <span className="ml-1 text-xs text-muted-foreground">(预制)</span>
              )}
              {role.member_count > 0 && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({role.member_count})
                </span>
              )}
            </button>
            {!role.is_system && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteRole(role);
                }}
              >
                ×
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export interface OrgRoleCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, description?: string) => void;
  isPending: boolean;
}

export function OrgRoleCreateDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: OrgRoleCreateDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim(), description.trim() || undefined);
    setName('');
    setDescription('');
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">新增角色</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">角色名称</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入角色名称"
              maxLength={50}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">描述（可选）</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入角色描述"
              maxLength={255}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              取消
            </Button>
            <Button type="submit" disabled={!name.trim() || isPending}>
              {isPending ? '创建中...' : '创建'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export interface OrgRoleDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: OrgRole | null;
  onConfirm: () => void;
  isPending: boolean;
}

export function OrgRoleDeleteDialog({
  open,
  onOpenChange,
  role,
  onConfirm,
  isPending,
}: OrgRoleDeleteDialogProps) {
  if (!open || !role) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">删除角色</h2>
        <p className="mb-6 text-muted-foreground">
          确定要删除角色 "{role.name}" 吗？此操作不可撤销。
        </p>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            取消
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? '删除中...' : '删除'}
          </Button>
        </div>
      </div>
    </div>
  );
}
