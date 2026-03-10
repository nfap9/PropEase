import { useState } from 'react'
import { View, Text, Input, Button, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { authApi } from '@/services/api'
import { useAuthStore } from '@/stores'
import './index.scss'

export default function LoginPage() {
  const { setToken, setUser } = useAuthStore()

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!phone) {
      setError('请输入手机号')
      return
    }
    if (!password) {
      setError('请输入密码')
      return
    }

    setError('')
    setLoading(true)

    try {
      const result = await authApi.login({ phone, password })
      setToken(result.access_token)

      // 获取用户信息
      const user = await authApi.getCurrentUser()
      setUser(user)
      Taro.setStorageSync('user', JSON.stringify(user))

      Taro.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => {
        Taro.navigateTo({ url: '/pages/dashboard/index' })
      }, 500)
    } catch (err: any) {
      const message = err.response?.data?.message || '登录失败，请重试'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="login-page">
      <View className="login-header">
        <Text className="login-title">寓管家</Text>
        <Text className="login-subtitle">公寓管理专家</Text>
      </View>

      <View className="login-form">
        <View className="form-item">
          <Text className="form-label">手机号</Text>
          <Input
            className="form-input"
            type="number"
            maxLength={11}
            placeholder="请输入手机号"
            value={phone}
            onInput={(e) => setPhone(e.detail.value)}
          />
        </View>

        <View className="form-item">
          <Text className="form-label">密码</Text>
          <Input
            className="form-input"
            type="password"
            placeholder="请输入密码"
            value={password}
            onInput={(e) => setPassword(e.detail.value)}
          />
        </View>

        {error && <Text className="form-error">{error}</Text>}

        <Button
          className="login-btn"
          loading={loading}
          onClick={handleLogin}
        >
          {loading ? '登录中...' : '登录'}
        </Button>

        <View className="login-actions">
          <Text className="action-link">忘记密码</Text>
          <Text className="action-link">注册账号</Text>
        </View>
      </View>
    </View>
  )
}
