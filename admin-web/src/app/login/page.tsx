'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { adminApiEndpoints, AdminTokenResponse } from '@/lib/api/admin-client';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@apartment-ultra/shared-ui/components/ui';

const schema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
});

type FormValues = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' },
  });

  // 检查认证状态和初始化状态
  useEffect(() => {
    const checkAuth = async () => {
      // 1. 检查是否已登录
      const token = localStorage.getItem('admin_access_token');
      if (token) {
        router.replace('/');
        return;
      }

      // 2. 检查系统是否已初始化
      try {
        const res = await adminApiEndpoints.checkInitStatus();
        if (!res.data?.initialized) {
          // 未初始化，跳转到初始化页面
          router.replace('/setup');
          return;
        }
      } catch {
        // 检查失败，继续显示登录页
      }

      setIsCheckingAuth(false);
    };
    checkAuth();
  }, [router]);

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      const res = await adminApiEndpoints.login(values.username, values.password);
      const data = res.data as AdminTokenResponse;
      if (data?.access_token) {
        localStorage.setItem('admin_access_token', data.access_token);
        router.replace('/');
        return;
      }
      setError('登录失败');
    } catch (e) {
      const err = e as {
        response?: {
          status?: number;
          data?: { message?: string; detail?: string };
          headers?: { 'retry-after'?: string };
        };
      };
      const msg =
        err.response?.data?.message ??
        (typeof err.response?.data?.detail === 'string' ? err.response.data.detail : null);
      if (err.response?.status === 429) {
        const retry = err.response?.headers?.['retry-after'];
        setError(
          retry ? `登录尝试过于频繁，请 ${retry} 秒后再试` : msg || '登录尝试过于频繁，请稍后再试'
        );
      } else {
        setError(msg || '用户名或密码错误');
      }
    }
  };

  // 检查认证状态时显示加载
  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4" data-testid="admin-login-page">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>管理后台登录</CardTitle>
          <CardDescription>请输入运营账号信息后登录后台。</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form method="post" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && <p className="text-sm text-destructive">{error}</p>}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>用户名</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入用户名" {...field} autoComplete="username" data-testid="admin-username-input" />
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
                        placeholder="请输入密码"
                        {...field}
                        autoComplete="current-password"
                        data-testid="admin-password-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" data-testid="admin-login-button">
                登录
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
