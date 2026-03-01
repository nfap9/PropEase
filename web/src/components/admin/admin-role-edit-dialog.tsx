'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { AdminRole } from '@/lib/api/admin-client';
import { AdminPermissionCheckboxGroup } from './admin-permission-checkbox-group';

const schema = z.object({
  name: z.string().min(1, '请输入角色名称'),
});

type FormData = z.infer<typeof schema>;

export interface AdminRoleEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: AdminRole | null;
  /** 选中的权限码（受控由父组件管理） */
  permissionCodes: string[];
  onPermissionToggle: (code: string, checked: boolean) => void;
  onSubmit: (data: { name?: string; permissionCodes: string[] }) => void;
  isPending: boolean;
}

/**
 * 编辑运营角色弹窗。单一职责：展示并提交角色名称与权限，不关心 API。
 */
export function AdminRoleEditDialog({
  open,
  onOpenChange,
  role,
  permissionCodes,
  onPermissionToggle,
  onSubmit,
  isPending,
}: AdminRoleEditDialogProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    values: role ? { name: role.name } : undefined,
  });

  const handleSubmit = (data: FormData) => {
    if (!role) return;
    onSubmit({
      name: role.is_system ? undefined : data.name,
      permissionCodes,
    });
  };

  if (!role) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑角色</DialogTitle>
          <DialogDescription>
            {role.is_system
              ? '系统预置角色不可修改名称，仅可调整权限'
              : `修改「${role.name}」的名称与权限`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>角色名称</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={role.is_system} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <AdminPermissionCheckboxGroup
              value={permissionCodes}
              onToggle={onPermissionToggle}
              idPrefix="edit"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                取消
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? '保存中…' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
