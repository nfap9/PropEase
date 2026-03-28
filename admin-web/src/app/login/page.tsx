'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { LoaderCircle, ShieldCheck } from 'lucide-react';
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
import { adminMessages } from '@/lib/i18n';

const schema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
});

type FormValues = z.infer<typeof schema>;

const AUTH_INPUT_CLASSNAME =
  'h-11 rounded-xl border-border/80 bg-background/80 px-3.5 shadow-none focus-visible:ring-2 focus-visible:ring-ring/15 focus-visible:ring-offset-0';

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  // 检查认证状态时显示加载
  if (isCheckingAuth) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.20),_transparent_26%),linear-gradient(135deg,_#eff6ff_0%,_#f8fafc_46%,_#e0ecff_100%)] px-4">
        <div className="absolute left-[-7rem] top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-[-6rem] right-[-4rem] h-72 w-72 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="relative flex items-center gap-3 rounded-full border border-white/70 bg-white/82 px-5 py-3 text-sm text-slate-600 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
          <span>{adminMessages.login.checkingStatus}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.20),_transparent_26%),linear-gradient(135deg,_#eff6ff_0%,_#f8fafc_46%,_#e0ecff_100%)]"
      data-testid="admin-login-page"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,_rgba(15,23,42,0.08),_transparent_18%),radial-gradient(circle_at_20%_85%,_rgba(14,165,233,0.12),_transparent_22%)]" />
      <div className="absolute left-[-8rem] top-16 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-0 right-[-5rem] h-80 w-80 rounded-full bg-sky-300/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid w-full gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)] lg:items-stretch">
          <section className="relative overflow-hidden rounded-[32px] border border-white/60 bg-white/52 p-6 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.28)] backdrop-blur-xl sm:p-8 lg:p-10">
            <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-white/35 to-transparent lg:block" />
            <div className="absolute left-10 top-10 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
            <div className="absolute bottom-16 right-16 h-32 w-32 rounded-full bg-sky-200/30 blur-3xl" />

            <div className="relative flex h-full flex-col">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
                <ShieldCheck className="h-3.5 w-3.5" />
                {adminMessages.login.badge}
              </div>

              <div className="mt-8 max-w-xl lg:mt-14">
                <p className="text-sm font-medium tracking-[0.08em] text-foreground/60 uppercase">Apartment Ultra</p>
                <h1 className="mt-4 text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl lg:text-[3.4rem] lg:leading-[1.08]">
                  {adminMessages.login.headline}
                </h1>
                <p className="mt-5 max-w-lg text-sm leading-7 text-slate-600 sm:text-base">
                  {adminMessages.login.description}
                </p>
              </div>

              <div className="mt-10 max-w-md rounded-[28px] border border-white/70 bg-white/68 px-6 py-5 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.3)]">
                <p className="text-xs font-medium tracking-[0.16em] text-primary/70 uppercase">{adminMessages.login.sloganLabel}</p>
                <p className="mt-3 text-base font-medium leading-7 text-slate-700">
                  {adminMessages.login.slogan}
                </p>
              </div>

              <div className="mt-auto hidden pt-10 lg:block">
                <p className="max-w-sm text-sm leading-7 text-slate-500">
                  {adminMessages.login.accessNotice}
                </p>
              </div>
            </div>
          </section>

          <section className="flex items-center lg:justify-end">
            <Card className="w-full max-w-xl rounded-[32px] border-white/70 bg-white/88 shadow-[0_28px_90px_-42px_rgba(15,23,42,0.42)] backdrop-blur-2xl">
              <CardHeader className="space-y-6 pb-6">
                <div className="inline-flex w-fit rounded-full border border-border/70 bg-muted/70 p-1">
                  <div className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 shadow-sm">
                    {adminMessages.login.entryBadge}
                  </div>
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-semibold text-slate-950 sm:text-[1.85rem]">{adminMessages.login.formTitle}</CardTitle>
                  <CardDescription className="max-w-lg text-sm leading-7 text-slate-600">
                    {adminMessages.login.formDescription}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-[28px] border border-white/70 bg-white/72 p-5 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.24)] sm:p-6">
                  <Form {...form}>
                    <form method="post" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                      {error ? (
                        <div className="rounded-2xl border border-destructive/15 bg-destructive/10 p-3 text-sm text-destructive">
                          {error}
                        </div>
                      ) : null}
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{adminMessages.login.form.username}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={adminMessages.login.form.usernamePlaceholder}
                                className={AUTH_INPUT_CLASSNAME}
                                {...field}
                                autoComplete="username"
                                data-testid="admin-username-input"
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
                            <FormLabel>{adminMessages.login.form.password}</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder={adminMessages.login.form.passwordPlaceholder}
                                className={AUTH_INPUT_CLASSNAME}
                                {...field}
                                autoComplete="current-password"
                                data-testid="admin-password-input"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="h-11 w-full text-sm"
                        disabled={isSubmitting}
                        data-testid="admin-login-button"
                      >
                        {isSubmitting ? adminMessages.login.form.submitting : adminMessages.login.form.submit}
                      </Button>
                    </form>
                  </Form>
                </div>
              </CardContent>
              <div className="border-t border-border/70 px-5 pb-5 pt-5 text-sm text-muted-foreground sm:px-6 sm:pb-6">
                {adminMessages.login.footer}
              </div>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
