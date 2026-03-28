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
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@apartment-ultra/shared-ui/components/ui';
import { useBrandConfig } from '@/lib/brand-config-context';
import { AuthLoadingScreen } from '@/components/auth/auth-loading-screen';
import { AuthShell } from '@/components/auth/auth-shell';

// 手机号验证正则
const phoneRegex = /^1[3-9]\d{9}$/;

const passwordLoginSchema = z.object({
  phone: z.string().regex(phoneRegex, '请输入有效的手机号'),
  password: z.string().min(8, '密码至少8个字符'),
});

type PasswordLoginFormValues = z.infer<typeof passwordLoginSchema>;

export default function LoginPage() {
  const { login, isAuthenticated, isLoading: isAuthLoading, organizations, organization } = useAuth();
  const brandConfig = useBrandConfig();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 已登录用户自动跳转到仪表盘
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      router.replace(getPostAuthRedirectPath(organizations, organization));
    }
  }, [isAuthLoading, isAuthenticated, organization, organizations, router]);

  const passwordForm = useForm<PasswordLoginFormValues>({
    resolver: zodResolver(passwordLoginSchema),
    defaultValues: {
      phone: '',
      password: '',
    },
  });

  // 密码登录
  const onPasswordSubmit = async (data: PasswordLoginFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const targetPath = await login(data.phone, data.password);
      router.replace(targetPath);
    } catch {
      setError('手机号或密码错误');
    } finally {
      setIsLoading(false);
    }
  };

  // 检查认证状态或已认证正在跳转时显示加载
  if (isAuthLoading || isAuthenticated) {
    return <AuthLoadingScreen label="正在进入工作台..." />;
  }

  return (
    <div data-testid="auth-login-page">
      <AuthShell
        mode="login"
        app_name={brandConfig.app_name}
        app_description={brandConfig.app_description}
        form_title="欢迎回来"
        form_description={brandConfig.login_subtitle}
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>
              还没有账户？{' '}
              <Link href="/register" className="font-medium text-primary hover:underline" data-testid="auth-register-link">
                立即注册
              </Link>
            </p>
          </div>
        }
      >
        <Form {...passwordForm}>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-5">
            {error && (
              <div className="rounded-2xl border border-destructive/15 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <FormField
              control={passwordForm.control}
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
              control={passwordForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>密码</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="请输入密码"
                      autoComplete="current-password"
                      {...field}
                      data-testid="auth-password-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="h-11 w-full text-sm" disabled={isLoading} data-testid="auth-login-button">
              {isLoading ? '登录中...' : '登录并进入工作台'}
            </Button>
          </form>
        </Form>
      </AuthShell>
    </div>
  );
}
