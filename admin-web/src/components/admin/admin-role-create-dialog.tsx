'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@apartment-ultra/shared-ui/components/ui';
import { AdminPermissionCheckboxGroup } from './admin-permission-checkbox-group';
import { adminMessages } from '@/i18n';

const schema = z.object({
  name: z.string().min(1, adminMessages.roles.createDialog.nameValidation),
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
          <DialogTitle>{adminMessages.roles.createDialog.title}</DialogTitle>
          <DialogDescription>{adminMessages.roles.createDialog.description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{adminMessages.roles.createDialog.nameLabel}</FormLabel>
                  <FormControl>
                    <Input placeholder={adminMessages.roles.createDialog.namePlaceholder} {...field} />
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
                {adminMessages.common.cancel}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? '提交中…' : adminMessages.common.create}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
