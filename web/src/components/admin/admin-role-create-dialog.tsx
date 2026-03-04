'use client';

import { useEffect } from 'react';
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
import { AdminPermissionCheckboxGroup } from './admin-permission-checkbox-group';

const schema = z.object({
  name: z.string().min(1, '请输入角色名称'),
});

type FormData = z.infer<typeof schema>;

export interface AdminRoleCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 选中的权限码（受控由父组件管理） */
  permissionCodes: string[];
  onPermissionToggle: (code: string, checked: boolean) => void;
  onSubmit: (name: string, permissionCodes: string[]) => void;
  isPending: boolean;
}

/**
 * 新建运营角色弹窗。单一职责：收集角色名称与权限并提交，不关心 API。
 */
export function AdminRoleCreateDialog({
  open,
  onOpenChange,
  permissionCodes,
  onPermissionToggle,
  onSubmit,
  isPending,
}: AdminRoleCreateDialogProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (open) form.reset({ name: '' });
  }, [open, form]);

  const handleSubmit = (data: FormData) => {
    onSubmit(data.name, permissionCodes);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto overscroll-contain">
        <DialogHeader>
          <DialogTitle>新建角色</DialogTitle>
          <DialogDescription>填写角色名称并勾选该角色可执行的权限</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>角色名称</FormLabel>
                  <FormControl>
                    <Input placeholder="如：运营专员" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <AdminPermissionCheckboxGroup
              value={permissionCodes}
              onToggle={onPermissionToggle}
              idPrefix="create"
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? '提交中…' : '创建'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
