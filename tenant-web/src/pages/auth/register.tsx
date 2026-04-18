
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/auth';
import { getPostAuthRedirectPath } from '@/utils/auth-redirect';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { useBrandConfig } from '@/contexts/brand-config';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import { AuthLoadingScreen } from '@/components/auth/auth-loading-screen';
import { AuthShell } from '@/components/auth/auth-shell';
import { tenantMessages } from '@/i18n';

// 手机号验证正则
const phoneRegex = /^1[3-9]\d{9}$/;

const registerSchema = z
  .object({
    phone: z.string().regex(phoneRegex, tenantMessages.auth.register.phoneValidation),
    password: z
      .string()
      .min(8, tenantMessages.auth.register.passwordMin)
      .regex(/[a-zA-Z]/, tenantMessages.auth.register.passwordLetter)
      .regex(/\d/, tenantMessages.auth.register.passwordNumber),
    full_name: z.string().min(2, tenantMessages.auth.register.nameValidation),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: tenantMessages.auth.register.confirmPasswordMismatch,
    path: ['confirm_password'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser, isAuthenticated, isLoading: isAuthLoading, organizations, organization } =
    useAuth();
  const brandConfig = useBrandConfig();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 已登录用户自动跳转到登录后目标页
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      navigate(getPostAuthRedirectPath(organizations, organization), { replace: true });
    }
  }, [isAuthLoading, isAuthenticated, organization, organizations, navigate]);

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
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="rounded-2xl border border-destructive/15 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="full_name" required>
                {tenantMessages.auth.register.name}
              </Label>
              <Controller
                name="full_name"
                control={form.control}
                render={({ field }) => (
                  <Input placeholder={tenantMessages.auth.register.namePlaceholder} autoComplete="name" {...field} data-testid="auth-name-input" />
                )}
              />
              {form.formState.errors.full_name && (
                <p className="text-sm text-destructive">{form.formState.errors.full_name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" required>
                {tenantMessages.auth.register.phone}
              </Label>
              <Controller
                name="phone"
                control={form.control}
                render={({ field }) => (
                  <Input
                    type="tel"
                    placeholder={tenantMessages.auth.register.phonePlaceholder}
                    autoComplete="tel"
                    {...field}
                    data-testid="auth-phone-input"
                  />
                )}
              />
              {form.formState.errors.phone && (
                <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" required>
                {tenantMessages.auth.register.password}
              </Label>
              <Controller
                name="password"
                control={form.control}
                render={({ field }) => (
                  <Input
                    type="password"
                    placeholder={tenantMessages.auth.register.passwordPlaceholder}
                    autoComplete="new-password"
                    {...field}
                    data-testid="auth-password-input"
                  />
                )}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password" required>
                {tenantMessages.auth.register.confirmPassword}
              </Label>
              <Controller
                name="confirm_password"
                control={form.control}
                render={({ field }) => (
                  <Input
                    type="password"
                    placeholder={tenantMessages.auth.register.confirmPasswordPlaceholder}
                    autoComplete="new-password"
                    {...field}
                    data-testid="auth-confirm-password-input"
                  />
                )}
              />
              {form.formState.errors.confirm_password && (
                <p className="text-sm text-destructive">{form.formState.errors.confirm_password.message}</p>
              )}
            </div>
            <Button type="submit" className="h-11 w-full text-sm" disabled={isLoading} data-testid="auth-register-button">
              {isLoading ? tenantMessages.auth.register.submitting : tenantMessages.auth.register.submit}
            </Button>
          </form>
        </FormProvider>
      </AuthShell>
    </div>
  );
}
