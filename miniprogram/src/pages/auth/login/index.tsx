import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/lib/api/client';
import './index.scss';

type LoginMode = 'password' | 'code';

export default function LoginPage() {
  const [mode, setMode] = useState<LoginMode>('password');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);

  const { login, loginLoading, loginError, sendCode, sendCodeLoading, isAuthenticated } = useAuth();

  // 已登录时跳转到首页
  useEffect(() => {
    if (isAuthenticated) {
      Taro.reLaunch({ url: '/pages/index/index' });
    }
  }, [isAuthenticated]);

  // 倒计时
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // 处理登录
  const handleLogin = () => {
    if (!phone.trim()) {
      Taro.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }

    if (mode === 'password') {
      if (!password.trim()) {
        Taro.showToast({ title: '请输入密码', icon: 'none' });
        return;
      }
      login({ phone: phone.trim(), password });
    } else {
      if (!code.trim()) {
        Taro.showToast({ title: '请输入验证码', icon: 'none' });
        return;
      }
      login({ phone: phone.trim(), verification_code: code });
    }
  };

  // 发送验证码
  const handleSendCode = () => {
    if (!phone.trim()) {
      Taro.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }
    if (countdown > 0) return;

    sendCode(
      { phone: phone.trim(), purpose: 'login' },
      {
        onSuccess: () => {
          Taro.showToast({ title: '验证码已发送', icon: 'success' });
          setCountdown(60);
        },
        onError: (error) => {
          const message =
            error instanceof ApiError ? error.message : '发送失败，请稍后重试';
          Taro.showToast({ title: message, icon: 'none' });
        },
      }
    );
  };

  // 处理错误
  useEffect(() => {
    if (loginError) {
      const message =
        loginError instanceof ApiError ? loginError.message : '登录失败，请稍后重试';
      Taro.showToast({ title: message, icon: 'none' });
    }
  }, [loginError]);

  return (
    <View className="login-page">
      <View className="login-header">
        <View className="logo">公寓管理</View>
        <View className="subtitle">高效管理您的公寓资产</View>
      </View>

      <View className="login-form">
        {/* 手机号输入 */}
        <View className="form-item">
          <Text className="label">手机号</Text>
          <Input
            className="input"
            type="number"
            placeholder="请输入手机号"
            maxlength={11}
            value={phone}
            onInput={(e) => setPhone(e.detail.value)}
          />
        </View>

        {/* 密码输入 */}
        {mode === 'password' && (
          <View className="form-item">
            <Text className="label">密码</Text>
            <Input
              className="input"
              type="password"
              placeholder="请输入密码"
              value={password}
              onInput={(e) => setPassword(e.detail.value)}
            />
          </View>
        )}

        {/* 验证码输入 */}
        {mode === 'code' && (
          <View className="form-item">
            <Text className="label">验证码</Text>
            <View className="code-row">
              <Input
                className="input code-input"
                type="number"
                placeholder="请输入验证码"
                maxlength={6}
                value={code}
                onInput={(e) => setCode(e.detail.value)}
              />
              <View
                className={`code-btn ${countdown > 0 ? 'disabled' : ''}`}
                onClick={handleSendCode}
              >
                <Text>{countdown > 0 ? `${countdown}s` : '获取验证码'}</Text>
              </View>
            </View>
          </View>
        )}

        {/* 切换登录方式 */}
        <View className="switch-mode" onClick={() => setMode(mode === 'password' ? 'code' : 'password')}>
          <Text>{mode === 'password' ? '验证码登录' : '密码登录'}</Text>
        </View>

        {/* 登录按钮 */}
        <View
          className={`login-btn ${loginLoading ? 'loading' : ''}`}
          onClick={handleLogin}
        >
          <Text>{loginLoading ? '登录中...' : '登录'}</Text>
        </View>

        {/* 注册入口 */}
        <View className="register-link" onClick={() => Taro.navigateTo({ url: '/pages/auth/register/index' })}>
          <Text>还没有账号？</Text>
          <Text className="link">立即注册</Text>
        </View>
      </View>

      <View className="footer">
        <Text className="agreement">
          登录即表示同意
          <Text className="link">《用户协议》</Text>
          和
          <Text className="link">《隐私政策》</Text>
        </Text>
      </View>
    </View>
  );
}
