
import { useEffect } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Checkbox, Modal, Input } from 'antd';
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
    <Modal open={open} onCancel={() => onOpenChange(false)} title={adminMessages.users.dialogs.createTitle} footer={null}>
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
                  <p className="text-sm text-red-500">{fieldState.error.message}</p>
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
                  <p className="text-sm text-red-500">{fieldState.error.message}</p>
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
                  <p className="text-sm text-red-500">{fieldState.error.message}</p>
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
                  <p className="text-sm text-red-500">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />
          <div className="flex justify-end gap-2">
            <Button onClick={() => onOpenChange(false)}>
              {adminMessages.common.cancel}
            </Button>
            <Button type="primary" disabled={isPending}>
              {isPending ? adminMessages.common.submitting : adminMessages.common.create}
            </Button>
          </div>
        </form>
      </FormProvider>
    </Modal>
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
    <Modal open={open} onCancel={() => onOpenChange(false)} title={adminMessages.users.dialogs.editTitle} footer={null}>
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
                  <p className="text-sm text-red-500">{fieldState.error.message}</p>
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
                  <p className="text-sm text-red-500">{fieldState.error.message}</p>
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
                  onChange={(e) => field.onChange(e.target.checked)}
                />
                <label htmlFor="edit-form-is_active" className="text-sm font-medium">
                  {adminMessages.users.fields.active}
                </label>
                {fieldState.error && (
                  <p className="text-sm text-red-500">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />
          <div className="flex justify-end gap-2">
            <Button onClick={() => onOpenChange(false)}>
              {adminMessages.common.cancel}
            </Button>
            <Button type="primary" disabled={isPending}>
              {isPending ? adminMessages.common.saving : adminMessages.common.save}
            </Button>
          </div>
        </form>
      </FormProvider>
    </Modal>
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
    <Modal open={open} onCancel={() => onOpenChange(false)} title={adminMessages.users.dialogs.resetPasswordTitle} footer={null}>
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
                  <p className="text-sm text-red-500">{fieldState.error.message}</p>
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
                  <p className="text-sm text-red-500">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />
          <div className="flex justify-end gap-2">
            <Button onClick={() => onOpenChange(false)}>
              {adminMessages.common.cancel}
            </Button>
            <Button type="primary" disabled={isPending}>
              {isPending ? adminMessages.common.submitting : adminMessages.common.confirm}
            </Button>
          </div>
        </form>
      </FormProvider>
    </Modal>
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
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title={adminMessages.users.deleteDialog.title}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={() => onOpenChange(false)}>
            {adminMessages.common.cancel}
          </Button>
          {!user?.is_system && (
            <Button
              danger
              onClick={onConfirm}
              disabled={isPending}
            >
              {isPending ? adminMessages.common.deleting : adminMessages.common.delete}
            </Button>
          )}
        </div>
      }
    >
      <div>
        {user?.is_system
          ? adminI18n.t('users.deleteDialog.builtinDescription', { username: user?.username ?? '' })
          : adminI18n.t('users.deleteDialog.confirmDescription', { username: user?.username ?? '' })}
      </div>
    </Modal>
  );
}
