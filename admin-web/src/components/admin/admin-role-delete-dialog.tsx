
import { ConfirmDialog } from '@apartment-ultra/shared-ui/components/ui';
import type { AdminRole } from '@/api/admin-client';
import { adminI18n, adminMessages } from '@/i18n';

export interface AdminRoleDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: AdminRole | null;
  onConfirm: () => void;
  isPending: boolean;
}

/**
 * 删除运营角色确认弹窗。系统预置角色（如超级管理员）不可删除，弹窗内会禁用确认。
 */
export function AdminRoleDeleteDialog({ open, onOpenChange, role, onConfirm, isPending }: AdminRoleDeleteDialogProps) {
  const isSystemRole = role?.is_system ?? false;

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={adminMessages.roles.deleteDialog.title}
      description={
        isSystemRole
          ? adminI18n.t('roles.deleteDialog.builtinDescription', { name: role?.name ?? '' })
          : adminI18n.t('roles.deleteDialog.confirmDescription', { name: role?.name ?? '' })
      }
      cancelLabel={adminMessages.common.cancel}
      confirmLabel={isPending ? adminMessages.common.deleting : adminMessages.common.delete}
      onConfirm={onConfirm}
      isPending={isPending}
      intent="destructive"
      hideConfirm={isSystemRole}
    />
  );
}
