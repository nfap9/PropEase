'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import type { AdminRole } from '@/lib/api/admin-client';
import { adminI18n, adminMessages } from '@/lib/i18n';

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
export function AdminRoleDeleteDialog({
  open,
  onOpenChange,
  role,
  onConfirm,
  isPending,
}: AdminRoleDeleteDialogProps) {
  const isSystemRole = role?.is_system ?? false;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{adminMessages.roles.deleteDialog.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {isSystemRole ? (
              <>{adminI18n.t('roles.deleteDialog.builtinDescription', { name: role?.name ?? '' })}</>
            ) : (
              <>{adminI18n.t('roles.deleteDialog.confirmDescription', { name: role?.name ?? '' })}</>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{adminMessages.common.cancel}</AlertDialogCancel>
          {!isSystemRole && (
            <AlertDialogAction
              onClick={onConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? adminMessages.common.deleting : adminMessages.common.delete}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
