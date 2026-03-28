import type {
  AdminPasswordReset,
  AdminUser,
  AdminUserCreate,
  AdminUserUpdate,
} from '@/lib/api/admin-client';
import type { CreateUserForm, EditUserForm } from './users.schemas';

export function getDefaultCreateUserFormValues(): CreateUserForm {
  return {
    username: '',
    password: '',
    name: '',
    email: '',
    role_id: '',
  };
}

export function getDefaultResetPasswordValues() {
  return {
    new_password: '',
    confirm: '',
  };
}

export function getEditUserFormValues(user: AdminUser): EditUserForm {
  return {
    name: user.name,
    email: user.email ?? '',
    role_id: user.role_id,
    is_active: user.is_active,
  };
}

export function toCreateUserPayload(data: CreateUserForm): AdminUserCreate {
  return {
    username: data.username,
    password: data.password,
    name: data.name,
    email: data.email || undefined,
    role_id: data.role_id,
  };
}

export function toUpdateUserPayload(data: EditUserForm): AdminUserUpdate {
  return {
    name: data.name,
    email: data.email || null,
    role_id: data.role_id,
    is_active: data.is_active,
  };
}

export function toResetPasswordPayload(newPassword: string): AdminPasswordReset {
  return {
    new_password: newPassword,
  };
}
