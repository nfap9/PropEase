import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Button, Input, Form } from 'antd';
import { useAuth } from '@/contexts/auth';
import { getPostAuthRedirectPath } from '@/utils/auth-redirect';
import { useBrandConfig } from '@/contexts/brand-config';
import { AuthLoadingScreen } from '@/pages/auth/components/auth-loading-screen';
import { AuthShell } from '@/pages/auth/components/auth-shell';
import { tenantMessages } from '@/i18n';

export default function RegisterPage() {
  const { register: registerUser, isAuthenticated, isLoading: isAuthLoading, organizations, organization } =
    useAuth();
  const brandConfig = useBrandConfig();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [form] = Form.useForm();

  // 已登录用户自动跳转到登录后目标页
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      navigate(getPostAuthRedirectPath(organizations, organization), { replace: true });
    }
  }, [isAuthLoading, isAuthenticated, organization, organizations, navigate]);

  const onFinish = async (values: { phone: string; password: string; full_name: string; confirm_password: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const targetPath = await registerUser(values.phone, values.password, values.full_name);
      navigate(targetPath, { replace: true });
    } catch {
      setError(tenantMessages.auth.register.failed);
    } finally {
      setIsLoading(false);
    }
  };

  // 检查认证状态或已认证正在跳转时显示加载
  if (isAuthLoading || isAuthenticated) {
    return <AuthLoadingScreen label={tenantMessages.auth.register.loading} />;
  }

  return (
    <div data-testid="auth-register-page">
      <AuthShell
        mode="register"
        app_name={brandConfig.app_name}
        app_description={brandConfig.app_description}
        form_title={tenantMessages.auth.register.title}
        form_description={brandConfig.register_subtitle}
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>
              {tenantMessages.auth.register.hasAccount}{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">
                {tenantMessages.auth.register.loginNow}
              </Link>
            </p>
            <span>{tenantMessages.auth.register.autoLoginHint}</span>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="space-y-5"
          initialValues={{ phone: '', password: '', full_name: '', confirm_password: '' }}
        >
          {error && (
            <div className="rounded-2xl border border-destructive/15 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <Form.Item
            label={tenantMessages.auth.register.name}
            name="full_name"
            required
            rules={[
              { required: true, message: '请输入姓名' },
              { min: 2, message: tenantMessages.auth.register.nameValidation },
            ]}
          >
            <Input placeholder={tenantMessages.auth.register.namePlaceholder} autoComplete="name" data-testid="auth-name-input" />
          </Form.Item>
          <Form.Item
            label={tenantMessages.auth.register.phone}
            name="phone"
            required
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: tenantMessages.auth.register.phoneValidation },
            ]}
          >
            <Input
              type="tel"
              placeholder={tenantMessages.auth.register.phonePlaceholder}
              autoComplete="tel"
              data-testid="auth-phone-input"
            />
          </Form.Item>
          <Form.Item
            label={tenantMessages.auth.register.password}
            name="password"
            required
            rules={[
              { required: true, message: '请输入密码' },
              { min: 8, message: tenantMessages.auth.register.passwordMin },
              { pattern: /[a-zA-Z]/, message: tenantMessages.auth.register.passwordLetter },
              { pattern: /\d/, message: tenantMessages.auth.register.passwordNumber },
            ]}
          >
            <Input
              type="password"
              placeholder={tenantMessages.auth.register.passwordPlaceholder}
              autoComplete="new-password"
              data-testid="auth-password-input"
            />
          </Form.Item>
          <Form.Item
            label={tenantMessages.auth.register.confirmPassword}
            name="confirm_password"
            required
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(tenantMessages.auth.register.confirmPasswordMismatch));
                },
              }),
            ]}
          >
            <Input
              type="password"
              placeholder={tenantMessages.auth.register.confirmPasswordPlaceholder}
              autoComplete="new-password"
              data-testid="auth-confirm-password-input"
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" className="h-11 w-full text-sm" loading={isLoading} disabled={isLoading} data-testid="auth-register-button">
            {isLoading ? tenantMessages.auth.register.submitting : tenantMessages.auth.register.submit}
          </Button>
        </Form>
      </AuthShell>
    </div>
  );
}
