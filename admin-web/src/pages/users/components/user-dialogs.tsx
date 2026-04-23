import { useEffect } from 'react';
import { Button, Checkbox, Modal, Form, Input } from 'antd';
import type { AdminUser } from '@/api/admin-client';
import { adminI18n, adminMessages } from '@/i18n';
import type { CreateUserForm, EditUserForm, ResetPasswordForm } from '@/schemas/users';
import { getDefaultCreateUserFormValues, getEditUserFormValues } from '@/hooks/users';

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
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) form.setFieldsValue(getDefaultCreateUserFormValues());
  }, [form, open]);

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title={adminMessages.users.dialogs.createTitle}
      footer={null}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        className="space-y-4"
        requiredMark={false}
      >
        <Form.Item
          name="username"
          label={<span className="text-sm font-medium">{adminMessages.users.fields.username}</span>}
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input placeholder={adminMessages.users.fields.usernamePlaceholder} />
        </Form.Item>
        <Form.Item
          name="password"
          label={<span className="text-sm font-medium">{adminMessages.users.fields.password}</span>}
          rules={[{ required: true, message: '请输入密码' }]}
        >
          <Input.Password placeholder={adminMessages.users.fields.passwordPlaceholder} />
        </Form.Item>
        <Form.Item
          name="name"
          label={<span className="text-sm font-medium">{adminMessages.users.fields.displayName}</span>}
          rules={[{ required: true, message: '请输入显示名称' }]}
        >
          <Input placeholder={adminMessages.users.fields.displayNamePlaceholder} />
        </Form.Item>
        <Form.Item
          name="email"
          label={<span className="text-sm font-medium">{adminMessages.users.fields.emailOptional}</span>}
        >
          <Input type="email" placeholder="email@example.com" />
        </Form.Item>
        <div className="flex justify-end gap-2">
          <Button onClick={() => onOpenChange(false)}>{adminMessages.common.cancel}</Button>
          <Button type="primary" htmlType="submit" disabled={isPending}>
            {isPending ? adminMessages.common.submitting : adminMessages.common.create}
          </Button>
        </div>
      </Form>
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
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && user) form.setFieldsValue(getEditUserFormValues(user));
  }, [form, open, user]);

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title={adminMessages.users.dialogs.editTitle}
      footer={null}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        className="space-y-4"
        requiredMark={false}
      >
        <Form.Item
          name="name"
          label={<span className="text-sm font-medium">{adminMessages.users.fields.displayName}</span>}
          rules={[{ required: true, message: '请输入显示名称' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="email"
          label={<span className="text-sm font-medium">{adminMessages.users.fields.email}</span>}
        >
          <Input type="email" />
        </Form.Item>
        <Form.Item
          name="is_active"
          valuePropName="checked"
        >
          <Checkbox id="edit-form-is_active">
            {adminMessages.users.fields.active}
          </Checkbox>
        </Form.Item>
        <div className="flex justify-end gap-2">
          <Button onClick={() => onOpenChange(false)}>{adminMessages.common.cancel}</Button>
          <Button type="primary" htmlType="submit" disabled={isPending}>
            {isPending ? adminMessages.common.saving : adminMessages.common.save}
          </Button>
        </div>
      </Form>
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
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) form.setFieldsValue({ new_password: '', confirm: '' });
  }, [form, open]);

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title={adminMessages.users.dialogs.resetPasswordTitle}
      footer={null}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        className="space-y-4"
        requiredMark={false}
      >
        <Form.Item
          name="new_password"
          label={<span className="text-sm font-medium">{adminMessages.users.fields.newPassword}</span>}
          rules={[{ required: true, message: '请输入新密码' }]}
        >
          <Input.Password placeholder={adminMessages.users.fields.passwordPlaceholder} />
        </Form.Item>
        <Form.Item
          name="confirm"
          label={<span className="text-sm font-medium">{adminMessages.users.fields.confirmPassword}</span>}
          dependencies={['new_password']}
          rules={[
            { required: true, message: '请再次输入密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('new_password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不一致'));
              },
            }),
          ]}
        >
          <Input.Password placeholder={adminMessages.users.fields.confirmPasswordPlaceholder} />
        </Form.Item>
        <div className="flex justify-end gap-2">
          <Button onClick={() => onOpenChange(false)}>{adminMessages.common.cancel}</Button>
          <Button type="primary" htmlType="submit" disabled={isPending}>
            {isPending ? adminMessages.common.submitting : adminMessages.common.confirm}
          </Button>
        </div>
      </Form>
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
          <Button onClick={() => onOpenChange(false)}>{adminMessages.common.cancel}</Button>
          {!user?.is_system && (
            <Button danger onClick={onConfirm} disabled={isPending}>
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
