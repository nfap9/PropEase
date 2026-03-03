'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { useBrandConfig } from '@/lib/brand-config-context';
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

// 手机号验证正则
const phoneRegex = /^1[3-9]\d{9}$/;

const registerSchema = z.object({
  phone: z.string().regex(phoneRegex, '请输入有效的手机号'),
  verification_code: z.string().length(6, '验证码必须是6位数字'),
  password: z.string().min(8, '密码至少8个字符').regex(/[a-zA-Z]/, '密码必须包含字母').regex(/\d/, '密码必须包含数字'),
  full_name: z.string().min(2, '姓名至少2个字符'),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: '两次输入的密码不一致',
  path: ['confirm_password'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser, sendSmsCode } = useAuth();
  const brandConfig = useBrandConfig();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      phone: '',
      verification_code: '',
      password: '',
      full_name: '',
      confirm_password: '',
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
    const phone = form.getValues('phone');
    if (!phoneRegex.test(phone)) {
      form.setError('phone', { message: '请输入有效的手机号' });
      return;
    }

    try {
      await sendSmsCode({ phone, purpose: 'register' });
      setCountdown(60);
    } catch {
      setError('发送验证码失败，请稍后重试');
    }
  }, [form, sendSmsCode]);

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      await registerUser(data.phone, data.password, data.full_name, data.verification_code);
      router.push('/dashboard');
    } catch {
      setError('注册失败，手机号可能已被使用或验证码无效');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{brandConfig.app_name}</CardTitle>
          <CardDescription>{brandConfig.register_subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
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
                      <Input placeholder="请输入姓名" {...field} />
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
                      <Input type="tel" placeholder="请输入手机号" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
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
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>密码</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="请输入密码（至少8位，包含字母和数字）" {...field} />
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
                      <Input type="password" placeholder="请再次输入密码" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? '注册中...' : '注册'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            已有账户？{' '}
            <Link href="/login" className="text-primary hover:underline">
              登录
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
