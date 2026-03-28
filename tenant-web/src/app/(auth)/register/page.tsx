'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/lib/auth/context';
import { getPostAuthRedirectPath } from '@/lib/auth/redirect';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { useBrandConfig } from '@/lib/brand-config-context';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@apartment-ultra/shared-ui/components/ui';
import { AuthLoadingScreen } from '@/components/auth/auth-loading-screen';
import { AuthShell } from '@/components/auth/auth-shell';

// 手机号验证正则
const phoneRegex = /^1[3-9]\d{9}$/;

const registerSchema = z
  .object({
    phone: z.string().regex(phoneRegex, '请输入有效的手机号'),
    password: z
      .string()
      .min(8, '密码至少8个字符')
      .regex(/[a-zA-Z]/, '密码必须包含字母')
      .regex(/\d/, '密码必须包含数字'),
    full_name: z.string().min(2, '姓名至少2个字符'),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: '两次输入的密码不一致',
    path: ['confirm_password'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser, isAuthenticated, isLoading: isAuthLoading, organizations, organization } =
    useAuth();
  const brandConfig = useBrandConfig();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 已登录用户自动跳转到登录后目标页
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      router.replace(getPostAuthRedirectPath(organizations, organization));
    }
  }, [isAuthLoading, isAuthenticated, organization, organizations, router]);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      phone: '',
      password: '',
      full_name: '',
      confirm_password: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const targetPath = await registerUser(data.phone, data.password, data.full_name);
      router.replace(targetPath);
    } catch {
      setError('注册失败，手机号可能已被使用');
    } finally {
      setIsLoading(false);
    }
  };

  // 检查认证状态或已认证正在跳转时显示加载
  if (isAuthLoading || isAuthenticated) {
    return <AuthLoadingScreen label="正在准备你的工作台..." />;
  }

  return (
    <div data-testid="auth-register-page">
      <AuthShell
        mode="register"
        app_name={brandConfig.app_name}
        app_description={brandConfig.app_description}
        form_title="创建账户"
        form_description={brandConfig.register_subtitle}
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>
              已有账户？{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                去登录
              </Link>
            </p>
            <span>注册成功后会自动登录并进入工作台</span>
          </div>
        }
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="rounded-2xl border border-destructive/15 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>姓名</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入姓名" autoComplete="name" {...field} data-testid="auth-name-input" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>手机号</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="请输入手机号"
                      autoComplete="tel"
                      {...field}
                      data-testid="auth-phone-input"
                    />
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
                  <FormLabel>密码</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="请输入密码（至少8位，包含字母和数字）"
                      autoComplete="new-password"
                      {...field}
                      data-testid="auth-password-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirm_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>确认密码</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="请再次输入密码"
                      autoComplete="new-password"
                      {...field}
                      data-testid="auth-confirm-password-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="h-11 w-full text-sm" disabled={isLoading} data-testid="auth-register-button">
              {isLoading ? '注册并登录中...' : '创建账户并进入系统'}
            </Button>
          </form>
        </Form>
      </AuthShell>
    </div>
  );
}
