
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button, Input, Form } from 'antd';
import { useAuth } from '@/contexts/auth';
import { getPostAuthRedirectPath } from '@/utils/auth-redirect';
import { useBrandConfig } from '@/contexts/brand-config';
import { AuthLoadingScreen } from '@/pages/auth/components/auth-loading-screen';
import { AuthShell } from '@/pages/auth/components/auth-shell';
import { tenantMessages } from '@/i18n';

// 手机号验证正则
const phoneRegex = /^1[3-9]\d{9}$/;

const passwordLoginSchema = z.object({
  phone: z.string().regex(phoneRegex, tenantMessages.auth.login.phoneValidation),
  password: z.string().min(8, tenantMessages.auth.login.passwordValidation),
});

type PasswordLoginFormValues = z.infer<typeof passwordLoginSchema>;

const AUTH_INPUT_CLASSNAME = 'h-11 rounded-xl border border-border/80 bg-background/80 px-3.5 shadow-none';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading: isAuthLoading, organizations, organization } = useAuth();
  const brandConfig = useBrandConfig();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 已登录用户自动跳转到仪表盘
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      navigate(getPostAuthRedirectPath(organizations, organization), { replace: true });
    }
  }, [isAuthLoading, isAuthenticated, organization, organizations, navigate]);

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
      navigate(targetPath, { replace: true });
    } catch {
      setError(tenantMessages.auth.login.invalidCredentials);
    } finally {
      setIsLoading(false);
    }
  };

  // 检查认证状态或已认证正在跳转时显示加载
  if (isAuthLoading || isAuthenticated) {
    return <AuthLoadingScreen label={tenantMessages.auth.login.loading} />;
  }

  return (
    <div data-testid="auth-login-page">
      <AuthShell
        mode="login"
        app_name={brandConfig.app_name}
        app_description={brandConfig.app_description}
        form_title={tenantMessages.auth.login.title}
        form_description={brandConfig.login_subtitle}
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>
              {tenantMessages.auth.login.noAccount}{' '}
              <Link to="/register" className="font-medium text-primary hover:underline" data-testid="auth-register-link">
                {tenantMessages.auth.login.registerNow}
              </Link>
            </p>
          </div>
        }
      >
          <Form
          layout="vertical"
          onFinish={passwordForm.handleSubmit(onPasswordSubmit)}
          className="space-y-5"
        >
          {error && (
            <div className="rounded-2xl border border-destructive/15 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <Form.Item
            label={tenantMessages.auth.login.phone}
            name="phone"
            required
            validateStatus={passwordForm.formState.errors.phone ? 'error' : ''}
            help={passwordForm.formState.errors.phone?.message}
          >
            <Controller
              name="phone"
              control={passwordForm.control}
              render={({ field }) => (
                <Input
                  type="tel"
                  placeholder={tenantMessages.auth.login.phonePlaceholder}
                  autoComplete="tel"
                  className={AUTH_INPUT_CLASSNAME}
                  {...field}
                  data-testid="auth-phone-input"
                />
              )}
            />
          </Form.Item>
          <Form.Item
            label={tenantMessages.auth.login.password}
            name="password"
            required
            validateStatus={passwordForm.formState.errors.password ? 'error' : ''}
            help={passwordForm.formState.errors.password?.message}
          >
            <Controller
              name="password"
              control={passwordForm.control}
              render={({ field }) => (
                <Input
                  type="password"
                  placeholder={tenantMessages.auth.login.passwordPlaceholder}
                  autoComplete="current-password"
                  className={AUTH_INPUT_CLASSNAME}
                  {...field}
                  data-testid="auth-password-input"
                />
              )}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" className="h-11 w-full text-sm" loading={isLoading} data-testid="auth-login-button">
            {isLoading ? tenantMessages.auth.login.submitting : tenantMessages.auth.login.submit}
          </Button>
        </Form>
      </AuthShell>
    </div>
  );
}
