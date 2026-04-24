import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card } from 'antd';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { adminApiEndpoints, AdminTokenResponse } from '@/api/admin-client';

export function SetupView() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState('');

  const checkStatus = useCallback(async () => {
    try {
      const res = await adminApiEndpoints.checkInitStatus();
      if (res.data?.initialized) {
        navigate('/login');
      } else {
        setIsChecking(false);
      }
    } catch {
      setError('无法检查系统状态，请刷新页面重试');
      setIsChecking(false);
    }
  }, [navigate]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const onFinish = async (values: { username: string; password: string; name?: string }) => {
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
        document.cookie = `admin_access_token=${data.access_token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        navigate('/');
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

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-500">检查系统状态...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md" styles={{ body: { padding: '24px' } }}>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">系统初始化</h2>
          <p className="mt-1 text-sm text-gray-500">
            创建第一个超级管理员账号，完成系统初始化
          </p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="space-y-4"
          requiredMark={false}
          initialValues={{ username: '', password: '', confirmPassword: '', name: '' }}
        >
          {error && (
            <p className="flex items-center gap-2 text-sm text-red-500">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          )}

          <Form.Item
            name="username"
            label={<span className="text-sm font-medium">用户名</span>}
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
              { max: 64, message: '用户名最多64个字符' },
              { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' },
            ]}
          >
            <Input placeholder="请输入用户名（字母、数字、下划线）" autoComplete="username" />
          </Form.Item>

          <Form.Item
            name="name"
            label={<span className="text-sm font-medium">显示名称（可选）</span>}
            rules={[{ max: 100, message: '名称最多100个字符' }]}
          >
            <Input placeholder="请输入显示名称" />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span className="text-sm font-medium">密码</span>}
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              placeholder="请输入密码"
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Item>

          <div className="space-y-1">
            <p className="text-xs">密码要求：</p>
            <ul className="grid grid-cols-2 gap-1 text-xs">
              <li className="flex items-center gap-1">
                {password.length >= 8 ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-gray-400" />
                )}
                至少8个字符
              </li>
              <li className="flex items-center gap-1">
                {/[A-Z]/.test(password) ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-gray-400" />
                )}
                大写字母
              </li>
              <li className="flex items-center gap-1">
                {/[a-z]/.test(password) ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-gray-400" />
                )}
                小写字母
              </li>
              <li className="flex items-center gap-1">
                {/[0-9]/.test(password) ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-gray-400" />
                )}
                数字
              </li>
              <li className="flex items-center gap-1">
                {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-gray-400" />
                )}
                特殊字符
              </li>
            </ul>
          </div>

          <Form.Item
            name="confirmPassword"
            label={<span className="text-sm font-medium">确认密码</span>}
            dependencies={['password']}
            rules={[
              { required: true, message: '请再次输入密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入密码" autoComplete="new-password" />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            className="w-full"
            disabled={isSubmitting}
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
        </Form>
      </Card>
    </div>
  );
}
