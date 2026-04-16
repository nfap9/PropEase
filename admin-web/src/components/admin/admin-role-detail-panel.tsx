
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import type { AdminRole } from '@/api/admin-client';
import { AdminPermissionCheckboxGroup } from './admin-permission-checkbox-group';
import { Save } from 'lucide-react';
import { adminMessages } from '@/i18n';

export interface AdminRoleDetailPanelProps {
  role: AdminRole | null;
  /** 当前编辑中的权限码（未保存前为草稿） */
  draftPermissionCodes: string[];
  onTogglePermission: (code: string, checked: boolean) => void;
  onSave: () => void;
  isSaving: boolean;
}

/**
 * 运营角色详情：右侧权限树 + 保存。预置角色只读不展示保存按钮。
 */
export function AdminRoleDetailPanel({
  role,
  draftPermissionCodes,
  onTogglePermission,
  onSave,
  isSaving,
}: AdminRoleDetailPanelProps) {
  if (!role) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        {adminMessages.roles.emptyState}
      </div>
    );
  }

  const readOnly = role.is_system;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b p-4">
        <h3 className="font-semibold">{role.name}</h3>
        {readOnly && (
          <p className="mt-1 text-sm text-muted-foreground">{adminMessages.roles.readonlyHint}</p>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <AdminPermissionCheckboxGroup
          idPrefix="role-detail"
          value={draftPermissionCodes}
          onToggle={onTogglePermission}
          disabled={readOnly}
          fullHeight
        />
      </div>
      {!readOnly && (
        <div className="border-t p-4">
          <Button onClick={onSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? adminMessages.common.saving : adminMessages.common.save}
          </Button>
        </div>
      )}
    </div>
  );
}
