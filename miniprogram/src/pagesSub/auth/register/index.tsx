import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/lib/api/client';
import './index.scss';

export default function RegisterPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);

  const { register, registerLoading, registerError, sendCode, sendCodeLoading, isAuthenticated } =
    useAuth();

  // 已登录时跳转到首页
  useEffect(() => {
    if (isAuthenticated) {
      Taro.switchTab({ url: '/pages/index/index' });
    }
  }, [isAuthenticated]);

  // 倒计时
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // 发送验证码
  const handleSendCode = () => {
    if (!phone.trim()) {
      Taro.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }
    if (countdown > 0) return;

    sendCode(
      { phone: phone.trim(), purpose: 'register' },
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

  // 处理注册
  const handleRegister = () => {
    if (!phone.trim()) {
      Taro.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }
    if (!fullName.trim()) {
      Taro.showToast({ title: '请输入姓名', icon: 'none' });
      return;
    }
    if (!password.trim()) {
      Taro.showToast({ title: '请输入密码', icon: 'none' });
      return;
    }
    if (password !== confirmPassword) {
      Taro.showToast({ title: '两次密码不一致', icon: 'none' });
      return;
    }
    if (!code.trim()) {
      Taro.showToast({ title: '请输入验证码', icon: 'none' });
      return;
    }

    register({
      phone: phone.trim(),
      password,
      full_name: fullName.trim(),
      verification_code: code,
    });
  };

  // 处理错误
  useEffect(() => {
    if (registerError) {
      const message =
        registerError instanceof ApiError ? registerError.message : '注册失败，请稍后重试';
      Taro.showToast({ title: message, icon: 'none' });
    }
  }, [registerError]);

  return (
    <View className="register-page">
      <View className="register-header">
        <Text className="title">注册账号</Text>
      </View>

      <View className="register-form">
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

        <View className="form-item">
          <Text className="label">姓名</Text>
          <Input
            className="input"
            placeholder="请输入您的姓名"
            value={fullName}
            onInput={(e) => setFullName(e.detail.value)}
          />
        </View>

        <View className="form-item">
          <Text className="label">密码</Text>
          <Input
            className="input"
            type="password"
            placeholder="请设置密码（至少6位）"
            value={password}
            onInput={(e) => setPassword(e.detail.value)}
          />
        </View>

        <View className="form-item">
          <Text className="label">确认密码</Text>
          <Input
            className="input"
            type="password"
            placeholder="请再次输入密码"
            value={confirmPassword}
            onInput={(e) => setConfirmPassword(e.detail.value)}
          />
        </View>

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

        <View
          className={`register-btn ${registerLoading ? 'loading' : ''}`}
          onClick={handleRegister}
        >
          <Text>{registerLoading ? '注册中...' : '注册'}</Text>
        </View>

        <View className="login-link" onClick={() => Taro.navigateBack()}>
          <Text>已有账号？</Text>
          <Text className="link">立即登录</Text>
        </View>
      </View>
    </View>
  );
}
