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
} from '@/components/ui/alert-dialog';
import type { AdminRole } from '@/lib/api/admin-client';

export interface AdminRoleDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: AdminRole | null;
  onConfirm: () => void;
  isPending: boolean;
}

/**
 * 删除运营角色确认弹窗。单一职责：确认删除并触发回调，不关心 API。
 */
export function AdminRoleDeleteDialog({
  open,
  onOpenChange,
  role,
  onConfirm,
  isPending,
}: AdminRoleDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除</AlertDialogTitle>
          <AlertDialogDescription>
            确定要删除角色「{role?.name}」吗？此操作不可恢复。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? '删除中…' : '删除'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
