import { z } from 'zod';

export const adminPasswordSchema = z
  .string()
  .min(8, '密码至少 8 位')
  .refine((value) => /[a-z]/.test(value), '密码须包含小写字母')
  .refine((value) => /[A-Z]/.test(value), '密码须包含大写字母')
  .refine((value) => /\d/.test(value), '密码须包含数字')
  .refine(
    (value) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?\s]/.test(value),
    '密码须包含特殊字符'
  );

export const createUserSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: adminPasswordSchema,
  name: z.string().min(1, '请输入姓名'),
  email: z.string().optional(),
  role_id: z.string().min(1, '请选择分工'),
});

export const editUserSchema = z.object({
  name: z.string().min(1, '请输入姓名'),
  email: z.string().optional(),
  role_id: z.string().min(1, '请选择分工'),
  is_active: z.boolean(),
});

export const resetPasswordSchema = z
  .object({
    new_password: adminPasswordSchema,
    confirm: z.string(),
  })
  .refine((data) => data.new_password === data.confirm, {
    message: '两次密码不一致',
    path: ['confirm'],
  });

export type CreateUserForm = z.infer<typeof createUserSchema>;
export type EditUserForm = z.infer<typeof editUserSchema>;
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
