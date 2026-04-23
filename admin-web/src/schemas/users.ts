export type CreateUserForm = {
  username: string;
  password: string;
  name: string;
  email?: string;
};

export type EditUserForm = {
  name: string;
  email?: string;
  is_active: boolean;
};

export type ResetPasswordForm = {
  new_password: string;
  confirm: string;
};

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) return { valid: false, message: '密码至少 8 位' };
  if (!/[a-z]/.test(password)) return { valid: false, message: '密码须包含小写字母' };
  if (!/[A-Z]/.test(password)) return { valid: false, message: '密码须包含大写字母' };
  if (!/\d/.test(password)) return { valid: false, message: '密码须包含数字' };
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?\s]/.test(password)) {
    return { valid: false, message: '密码须包含特殊字符' };
  }
  return { valid: true };
}
