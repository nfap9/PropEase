'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui';
import { Checkbox } from '@/components/ui';
import { ConfirmDialog } from '@apartment-ultra/shared-ui/components/ui';
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
import { Input } from '@/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';
import type { AdminRole, AdminUser } from '@/lib/api/admin-client';
import { adminI18n, adminMessages } from '@/lib/i18n';
import {
  createUserSchema,
  editUserSchema,
  resetPasswordSchema,
  type CreateUserForm,
  type EditUserForm,
  type ResetPasswordForm,
} from '../users.schemas';
import { getDefaultCreateUserFormValues, getDefaultResetPasswordValues, getEditUserFormValues } from '../users.utils';

export function CreateUserDialog({
  open,
  onOpenChange,
  roles,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: AdminRole[] | undefined;
  onSubmit: (data: CreateUserForm) => void;
  isPending: boolean;
}) {
  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: getDefaultCreateUserFormValues(),
  });

  useEffect(() => {
    if (open) {
      form.reset(getDefaultCreateUserFormValues());
    }
  }, [form, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{adminMessages.users.dialogs.createTitle}</DialogTitle>
          <DialogDescription>{adminMessages.users.dialogs.createDescription}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{adminMessages.users.fields.username}</FormLabel>
                  <FormControl>
                    <Input placeholder={adminMessages.users.fields.usernamePlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{adminMessages.users.fields.password}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder={adminMessages.users.fields.passwordPlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{adminMessages.users.fields.displayName}</FormLabel>
                  <FormControl>
                    <Input placeholder={adminMessages.users.fields.displayNamePlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{adminMessages.users.fields.emailOptional}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{adminMessages.users.fields.accountRole}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={adminMessages.users.fields.selectRolePlaceholder} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(roles ?? []).map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {adminMessages.common.cancel}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? adminMessages.common.submitting : adminMessages.common.create}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function EditUserDialog({
  open,
  onOpenChange,
  user,
  roles,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null;
  roles: AdminRole[] | undefined;
  onSubmit: (data: EditUserForm) => void;
  isPending: boolean;
}) {
  const form = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
  });

  useEffect(() => {
    if (open && user) {
      form.reset(getEditUserFormValues(user));
    }
  }, [form, open, user]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{adminMessages.users.dialogs.editTitle}</DialogTitle>
          <DialogDescription>{user ? `编辑 ${user.username}` : ''}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{adminMessages.users.fields.displayName}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{adminMessages.users.fields.email}</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{adminMessages.users.fields.accountRole}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={adminMessages.users.fields.selectRolePlaceholder} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(roles ?? []).map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      id="edit-form-is_active"
                      checked={field.value}
                      onCheckedChange={(value) => field.onChange(value === true)}
                    />
                  </FormControl>
                  <FormLabel htmlFor="edit-form-is_active" className="!mt-0">
                    {adminMessages.users.fields.active}
                  </FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {adminMessages.common.cancel}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? adminMessages.common.saving : adminMessages.common.save}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  user,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null;
  onSubmit: (data: ResetPasswordForm) => void;
  isPending: boolean;
}) {
  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: getDefaultResetPasswordValues(),
  });

  useEffect(() => {
    if (open) {
      form.reset(getDefaultResetPasswordValues());
    }
  }, [form, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{adminMessages.users.dialogs.resetPasswordTitle}</DialogTitle>
          <DialogDescription>
            {user ? adminI18n.t('users.dialogs.resetPasswordDescription', { username: user.username }) : ''}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="new_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{adminMessages.users.fields.newPassword}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder={adminMessages.users.fields.passwordPlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{adminMessages.users.fields.confirmPassword}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={adminMessages.users.fields.confirmPasswordPlaceholder}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {adminMessages.common.cancel}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? adminMessages.common.submitting : adminMessages.common.confirm}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  user,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={adminMessages.users.deleteDialog.title}
      description={
        user?.is_system
          ? adminI18n.t('users.deleteDialog.builtinDescription', { username: user?.username ?? '' })
          : adminI18n.t('users.deleteDialog.confirmDescription', { username: user?.username ?? '' })
      }
      cancelLabel={adminMessages.common.cancel}
      confirmLabel={isPending ? adminMessages.common.deleting : adminMessages.common.delete}
      onConfirm={onConfirm}
      isPending={isPending}
      intent="destructive"
      hideConfirm={user?.is_system}
    />
  );
}
