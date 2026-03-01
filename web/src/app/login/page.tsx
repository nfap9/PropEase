'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// 手机号验证正则
const phoneRegex = /^1[3-9]\d{9}$/;

const passwordLoginSchema = z.object({
  phone: z.string().regex(phoneRegex, '请输入有效的手机号'),
  password: z.string().min(8, '密码至少8个字符'),
});

const codeLoginSchema = z.object({
  phone: z.string().regex(phoneRegex, '请输入有效的手机号'),
  verification_code: z.string().length(6, '验证码必须是6位数字'),
});

type PasswordLoginFormValues = z.infer<typeof passwordLoginSchema>;
type CodeLoginFormValues = z.infer<typeof codeLoginSchema>;

export default function LoginPage() {
  const { login, sendSmsCode } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loginMode, setLoginMode] = useState<'password' | 'code'>('password');

  const passwordForm = useForm<PasswordLoginFormValues>({
    resolver: zodResolver(passwordLoginSchema),
    defaultValues: {
      phone: '',
      password: '',
    },
  });

  const codeForm = useForm<CodeLoginFormValues>({
    resolver: zodResolver(codeLoginSchema),
    defaultValues: {
      phone: '',
      verification_code: '',
    },
  });

  // 倒计时效果
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 发送验证码
  const handleSendCode = useCallback(async () => {
    const phone = codeForm.getValues('phone');
    if (!phoneRegex.test(phone)) {
      codeForm.setError('phone', { message: '请输入有效的手机号' });
      return;
    }

    try {
      await sendSmsCode({ phone, purpose: 'login' });
      setCountdown(60);
    } catch {
      setError('发送验证码失败，请稍后重试');
    }
  }, [codeForm, sendSmsCode]);

  // 密码登录
  const onPasswordSubmit = async (data: PasswordLoginFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      await login(data.phone, data.password);
      router.push('/dashboard');
    } catch {
      setError('手机号或密码错误');
    } finally {
      setIsLoading(false);
    }
  };

  // 验证码登录
  const onCodeSubmit = async (data: CodeLoginFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      await login(data.phone, undefined, data.verification_code);
      router.push('/dashboard');
    } catch {
      setError('验证码错误或已过期');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">公寓管理系统</CardTitle>
          <CardDescription>用户登录，管理公寓、租客与账单</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={loginMode} onValueChange={(v) => setLoginMode(v as 'password' | 'code')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password">密码登录</TabsTrigger>
              <TabsTrigger value="code">验证码登录</TabsTrigger>
            </TabsList>

            <TabsContent value="password" className="mt-4">
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  {error && (
                    <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
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
                          <Input type="tel" placeholder="请输入手机号" {...field} />
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
                          <Input type="password" placeholder="请输入密码" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? '登录中...' : '登录'}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="code" className="mt-4">
              <Form {...codeForm}>
                <form onSubmit={codeForm.handleSubmit(onCodeSubmit)} className="space-y-4">
                  {error && (
                    <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}
                  <FormField
                    control={codeForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>手机号</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="请输入手机号" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={codeForm.control}
                    name="verification_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>验证码</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              type="text"
                              maxLength={6}
                              placeholder="请输入验证码"
                              {...field}
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={countdown > 0}
                            onClick={handleSendCode}
                            className="shrink-0"
                          >
                            {countdown > 0 ? `${countdown}秒` : '获取验证码'}
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? '登录中...' : '登录'}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-2 border-t pt-4">
          <p className="text-sm text-muted-foreground">
            还没有账户？{' '}
            <Link href="/register" className="text-primary hover:underline">
              注册
            </Link>
          </p>
          <p className="text-sm text-muted-foreground">
            运营人员？{' '}
            <Link href="/admin/login" className="text-primary hover:underline">
              前往管理后台
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
