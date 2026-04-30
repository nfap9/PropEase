import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card } from 'antd';
import { LoaderCircle, ShieldCheck } from 'lucide-react';
import { adminApiEndpoints, AdminTokenResponse } from '@/api/admin-client';
import { adminMessages } from '@/i18n';

const AUTH_INPUT_CLASSNAME = 'h-11 rounded-xl border border-gray-300 px-3.5 shadow-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';

export function LoginView() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [error, setError] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('admin_access_token');
    if (token) {
      document.cookie = `admin_access_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      navigate('/');
      return;
    }
    try {
      const res = await adminApiEndpoints.checkInitStatus();
      if (!res.data?.initialized) {
        navigate('/setup');
        return;
      }
    } catch {
      // 检查失败，继续显示登录页
    }
    setIsCheckingAuth(false);
  }, [navigate]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const onFinish = async (values: { username: string; password: string }) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await adminApiEndpoints.login(values.username, values.password);
      const data = res.data as AdminTokenResponse;
      if (data?.access_token) {
        localStorage.setItem('admin_access_token', data.access_token);
        document.cookie = `admin_access_token=${data.access_token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        navigate('/');
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

  if (isCheckingAuth) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-50 px-4">
        <div className="absolute left-[-7rem] top-10 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-[-6rem] right-[-4rem] h-72 w-72 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="relative flex items-center gap-3 rounded-full border border-gray-200 bg-white px-5 py-3 text-sm text-gray-500 shadow-lg">
          <LoaderCircle className="h-4 w-4 animate-spin text-blue-500" />
          <span>{adminMessages.login.checkingStatus}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-sky-100"
      data-testid="admin-login-page"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,_hsl(0deg_0%_0%/0.06),_transparent_18%),radial-gradient(circle_at_20%_85%,_hsl(211deg_100%_50%/0.10),_transparent_22%)]" />
      <div className="absolute left-[-8rem] top-16 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute bottom-0 right-[-5rem] h-80 w-80 rounded-full bg-sky-300/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid w-full gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)] lg:items-center">
          <section className="relative p-6 sm:p-8 lg:p-10">
            <div className="relative flex h-full flex-col">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-semibold tracking-[0.16em] text-blue-600 uppercase">
                <ShieldCheck className="h-3.5 w-3.5" />
                {adminMessages.login.badge}
              </div>

              <div className="mt-8 max-w-xl lg:mt-14">
                <p className="text-sm font-medium tracking-[0.08em] text-gray-500 uppercase">PropEase</p>
                <h1 className="mt-4 text-3xl font-semibold leading-tight text-gray-900 sm:text-4xl lg:text-[3.4rem] lg:leading-[1.08]">
                  {adminMessages.login.headline}
                </h1>
                <p className="mt-5 max-w-lg text-sm leading-7 text-gray-600 sm:text-base">
                  {adminMessages.login.description}
                </p>
              </div>

              <div className="mt-10 max-w-md">
                <p className="text-xs font-medium tracking-[0.16em] text-blue-600/80 uppercase">{adminMessages.login.sloganLabel}</p>
                <p className="mt-3 text-base font-medium leading-7 text-gray-600">
                  {adminMessages.login.slogan}
                </p>
              </div>

              <div className="mt-auto hidden pt-10 lg:block">
                <p className="max-w-sm text-sm leading-7 text-gray-600">
                  {adminMessages.login.accessNotice}
                </p>
              </div>
            </div>
          </section>

          <section className="flex items-center lg:justify-end">
            <Card
              className="w-full max-w-xl rounded-[32px] border border-gray-200/60 bg-white/70 shadow-2xl backdrop-blur-2xl"
              styles={{ body: { padding: 0 } }}
            >
              <div className="space-y-6 border-b border-gray-200/70 px-6 pb-6 pt-5">
                <div className="inline-flex w-fit rounded-full border border-gray-200 bg-gray-50 p-1">
                  <div className="rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm">
                    {adminMessages.login.entryBadge}
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold text-gray-900 sm:text-[1.85rem]">{adminMessages.login.formTitle}</h2>
                  <p className="max-w-lg text-sm leading-7 text-gray-500">
                    {adminMessages.login.formDescription}
                  </p>
                </div>
              </div>
              <div className="space-y-6 px-6 pb-5 pt-5">
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={onFinish}
                  className="space-y-5"
                  requiredMark={false}
                >
                  {error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                      {error}
                    </div>
                  ) : null}
                  <Form.Item
                    name="username"
                    label={<span className="text-sm font-medium">{adminMessages.login.form.username}</span>}
                    rules={[{ required: true, message: '请输入用户名' }]}
                  >
                    <Input
                      placeholder={adminMessages.login.form.usernamePlaceholder}
                      className={AUTH_INPUT_CLASSNAME}
                      autoComplete="username"
                      data-testid="admin-username-input"
                    />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    label={<span className="text-sm font-medium">{adminMessages.login.form.password}</span>}
                    rules={[{ required: true, message: '请输入密码' }]}
                  >
                    <Input.Password
                      placeholder={adminMessages.login.form.passwordPlaceholder}
                      className={AUTH_INPUT_CLASSNAME}
                      autoComplete="current-password"
                      data-testid="admin-password-input"
                    />
                  </Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    className="h-11 w-full text-sm"
                    disabled={isSubmitting}
                    data-testid="admin-login-button"
                  >
                    {isSubmitting ? adminMessages.login.form.submitting : adminMessages.login.form.submit}
                  </Button>
                </Form>
              </div>
              <div className="border-t border-gray-200/70 px-5 pb-5 pt-5 text-sm text-gray-500 sm:px-6 sm:pb-6">
                {adminMessages.login.footer}
              </div>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
