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
          <AlertDialogTitle>确认删除</AlertDialogTitle>
          <AlertDialogDescription>
            {isSystemRole ? (
              <>系统预置角色「{role?.name}」不可删除。</>
            ) : (
              <>确定要删除角色「{role?.name}」吗？此操作不可恢复。</>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          {!isSystemRole && (
            <AlertDialogAction
              onClick={onConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? '删除中…' : '删除'}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
