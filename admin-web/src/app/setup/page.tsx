'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { adminApiEndpoints, AdminTokenResponse } from '@/lib/api/admin-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const schema = z
  .object({
    username: z
      .string()
      .min(3, '用户名至少3个字符')
      .max(64, '用户名最多64个字符')
      .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
    password: z.string().min(8, '密码至少8个字符'),
    confirmPassword: z.string(),
    name: z.string().max(100, '名称最多100个字符').optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

// 密码强度验证
function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: '密码至少8个字符' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: '密码必须包含大写字母' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: '密码必须包含小写字母' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: '密码必须包含数字' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: '密码必须包含特殊字符' };
  }
  return { valid: true };
}

export default function AdminSetupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '', confirmPassword: '', name: '' },
  });

  const password = form.watch('password');

  // 密码强度指示器
  const passwordValidation = password ? validatePassword(password) : { valid: false };

  // 检查初始化状态
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await adminApiEndpoints.checkInitStatus();
        if (res.data?.initialized) {
          // 已初始化，跳转到登录页
          router.replace('/login');
        } else {
          setIsChecking(false);
        }
      } catch {
        setError('无法检查系统状态，请刷新页面重试');
        setIsChecking(false);
      }
    };
    checkStatus();
  }, [router]);

  const onSubmit = async (values: FormValues) => {
    // 额外验证密码强度
    const validation = validatePassword(values.password);
    if (!validation.valid) {
      setError(validation.message!);
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const res = await adminApiEndpoints.setupSystem({
        username: values.username,
        password: values.password,
        name: values.name || undefined,
      });
      const data = res.data as AdminTokenResponse;
      if (data?.access_token) {
        localStorage.setItem('admin_access_token', data.access_token);
        router.replace('/');
        return;
      }
      setError('初始化失败');
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || '初始化失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 检查状态时显示加载
  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="text-muted-foreground">检查系统状态...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>系统初始化</CardTitle>
          <CardDescription>
            创建第一个超级管理员账号，完成系统初始化
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <p className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </p>
              )}

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>用户名</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="请输入用户名（字母、数字、下划线）"
                        {...field}
                        autoComplete="username"
                      />
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
                    <FormLabel>显示名称（可选）</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入显示名称" {...field} />
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
                        autoComplete="new-password"
                      />
                    </FormControl>
                    <FormDescription className="space-y-1">
                      <p className="text-xs">密码要求：</p>
                      <ul className="grid grid-cols-2 gap-1 text-xs">
                        <li className="flex items-center gap-1">
                          {password.length >= 8 ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                          ) : (
                            <AlertCircle className="h-3 w-3 text-muted-foreground" />
                          )}
                          至少8个字符
                        </li>
                        <li className="flex items-center gap-1">
                          {/[A-Z]/.test(password) ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                          ) : (
                            <AlertCircle className="h-3 w-3 text-muted-foreground" />
                          )}
                          大写字母
                        </li>
                        <li className="flex items-center gap-1">
                          {/[a-z]/.test(password) ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                          ) : (
                            <AlertCircle className="h-3 w-3 text-muted-foreground" />
                          )}
                          小写字母
                        </li>
                        <li className="flex items-center gap-1">
                          {/[0-9]/.test(password) ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                          ) : (
                            <AlertCircle className="h-3 w-3 text-muted-foreground" />
                          )}
                          数字
                        </li>
                        <li className="flex items-center gap-1">
                          {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                          ) : (
                            <AlertCircle className="h-3 w-3 text-muted-foreground" />
                          )}
                          特殊字符
                        </li>
                      </ul>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>确认密码</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="请再次输入密码"
                        {...field}
                        autoComplete="new-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !passwordValidation.valid}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    初始化中...
                  </>
                ) : (
                  '完成初始化'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
