
import { useEffect } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Checkbox } from '@apartment-ultra/shared-ui/components/ui';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import type { AdminUser } from '@/api/admin-client';
import { adminI18n, adminMessages } from '@/i18n';
import {
  createUserSchema,
  editUserSchema,
  resetPasswordSchema,
  type CreateUserForm,
  type EditUserForm,
  type ResetPasswordForm,
} from '@/schemas/users';
import { getDefaultCreateUserFormValues, getDefaultResetPasswordValues, getEditUserFormValues } from '@/utils/users';

export function CreateUserDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Controller
              control={form.control}
              name="username"
              render={({ field, fieldState }) => (
                <div className="space-y-1">
                  <label className="text-sm font-medium">{adminMessages.users.fields.username}</label>
                  <Input placeholder={adminMessages.users.fields.usernamePlaceholder} {...field} />
                  {fieldState.error && (
                    <p className="text-sm text-destructive">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />
            <Controller
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <div className="space-y-1">
                  <label className="text-sm font-medium">{adminMessages.users.fields.password}</label>
                  <Input type="password" placeholder={adminMessages.users.fields.passwordPlaceholder} {...field} />
                  {fieldState.error && (
                    <p className="text-sm text-destructive">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <div className="space-y-1">
                  <label className="text-sm font-medium">{adminMessages.users.fields.displayName}</label>
                  <Input placeholder={adminMessages.users.fields.displayNamePlaceholder} {...field} />
                  {fieldState.error && (
                    <p className="text-sm text-destructive">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <div className="space-y-1">
                  <label className="text-sm font-medium">{adminMessages.users.fields.emailOptional}</label>
                  <Input type="email" placeholder="email@example.com" {...field} />
                  {fieldState.error && (
                    <p className="text-sm text-destructive">{fieldState.error.message}</p>
                  )}
                </div>
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
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

export function EditUserDialog({
  open,
  onOpenChange,
  user,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null;
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
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <div className="space-y-1">
                  <label className="text-sm font-medium">{adminMessages.users.fields.displayName}</label>
                  <Input {...field} />
                  {fieldState.error && (
                    <p className="text-sm text-destructive">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <div className="space-y-1">
                  <label className="text-sm font-medium">{adminMessages.users.fields.email}</label>
                  <Input type="email" {...field} />
                  {fieldState.error && (
                    <p className="text-sm text-destructive">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />
            <Controller
              control={form.control}
              name="is_active"
              render={({ field, fieldState }) => (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="edit-form-is_active"
                    checked={field.value}
                    onCheckedChange={(value) => field.onChange(value === true)}
                  />
                  <label htmlFor="edit-form-is_active" className="text-sm font-medium !mt-0">
                    {adminMessages.users.fields.active}
                  </label>
                  {fieldState.error && (
                    <p className="text-sm text-destructive">{fieldState.error.message}</p>
                  )}
                </div>
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
        </FormProvider>
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
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Controller
              control={form.control}
              name="new_password"
              render={({ field, fieldState }) => (
                <div className="space-y-1">
                  <label className="text-sm font-medium">{adminMessages.users.fields.newPassword}</label>
                  <Input type="password" placeholder={adminMessages.users.fields.passwordPlaceholder} {...field} />
                  {fieldState.error && (
                    <p className="text-sm text-destructive">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />
            <Controller
              control={form.control}
              name="confirm"
              render={({ field, fieldState }) => (
                <div className="space-y-1">
                  <label className="text-sm font-medium">{adminMessages.users.fields.confirmPassword}</label>
                  <Input
                    type="password"
                    placeholder={adminMessages.users.fields.confirmPasswordPlaceholder}
                    {...field}
                  />
                  {fieldState.error && (
                    <p className="text-sm text-destructive">{fieldState.error.message}</p>
                  )}
                </div>
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
        </FormProvider>
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{adminMessages.users.deleteDialog.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {user?.is_system
              ? adminI18n.t('users.deleteDialog.builtinDescription', { username: user?.username ?? '' })
              : adminI18n.t('users.deleteDialog.confirmDescription', { username: user?.username ?? '' })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{adminMessages.common.cancel}</AlertDialogCancel>
          {!user?.is_system && (
            <AlertDialogAction
              onClick={onConfirm}
              disabled={isPending}
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
