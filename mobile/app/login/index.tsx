import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks'
import { Colors } from '@/constants'

// 登录表单 Schema
const loginSchema = z.object({
  phone: z.string().min(11, '请输入正确的手机号').max(11),
  password: z.string().min(8, '密码至少8位'),
})

// 注册表单 Schema
const registerSchema = z.object({
  phone: z.string().min(11, '请输入正确的手机号').max(11),
  password: z.string().min(8, '密码至少8位'),
  full_name: z.string().min(2, '姓名至少2个字'),
})

type LoginFormData = z.infer<typeof loginSchema>
type RegisterFormData = z.infer<typeof registerSchema>

export default function LoginScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { login, register } = useAuth()

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: '',
      password: '',
    },
  })

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      phone: '',
      password: '',
      full_name: '',
    },
  })

  const handleLogin = async (data: LoginFormData) => {
    setLoading(true)
    setError(null)
    try {
      await login(data.phone, data.password)
      router.replace('/')
    } catch (err: any) {
      setError(err.message || '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (data: RegisterFormData) => {
    setLoading(true)
    setError(null)
    try {
      await register(data.phone, data.password, data.full_name)
      router.replace('/')
    } catch (err: any) {
      setError(err.message || '注册失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: Colors.background }}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ paddingHorizontal: 32, paddingTop: 80 }}>
          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: 48 }}>
            <View
              style={{
                width: 80,
                height: 80,
                backgroundColor: Colors.primary,
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                shadowColor: Colors.primary,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 8,
                transform: [{ rotate: '3deg' }],
              }}
            >
              <Text style={{ fontSize: 40, color: 'white' }}>🏢</Text>
            </View>
            <Text style={{ fontSize: 28, fontWeight: '900', color: Colors.textPrimary, letterSpacing: -0.5 }}>
              寓管家
            </Text>
            <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 8, fontWeight: '500' }}>
              AI 驱动的智能化公寓租赁管理系统
            </Text>
            <View
              style={{
                marginTop: 12,
                paddingHorizontal: 12,
                paddingVertical: 4,
                backgroundColor: '#EFF6FF',
                borderRadius: 12,
              }}
            >
              <Text style={{ fontSize: 10, color: Colors.primary, fontWeight: '700' }}>
                2026.03.10 版本
              </Text>
            </View>
          </View>

          {/* Tab 切换 */}
          <View
            style={{
              flexDirection: 'row',
              padding: 4,
              backgroundColor: '#F1F5F9',
              borderRadius: 16,
              marginBottom: 24,
            }}
          >
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: mode === 'login' ? 'white' : 'transparent',
                shadowColor: mode === 'login' ? '#000' : 'transparent',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: mode === 'login' ? 0.05 : 0,
                shadowRadius: 2,
                elevation: mode === 'login' ? 1 : 0,
              }}
              onPress={() => setMode('login')}
            >
              <Text
                style={{
                  textAlign: 'center',
                  fontSize: 14,
                  fontWeight: '700',
                  color: mode === 'login' ? Colors.primary : Colors.textMuted,
                }}
              >
                登录
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: mode === 'register' ? 'white' : 'transparent',
                shadowColor: mode === 'register' ? '#000' : 'transparent',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: mode === 'register' ? 0.05 : 0,
                shadowRadius: 2,
                elevation: mode === 'register' ? 1 : 0,
              }}
              onPress={() => setMode('register')}
            >
              <Text
                style={{
                  textAlign: 'center',
                  fontSize: 14,
                  fontWeight: '700',
                  color: mode === 'register' ? Colors.primary : Colors.textMuted,
                }}
              >
                注册
              </Text>
            </TouchableOpacity>
          </View>

          {/* 表单 */}
          {mode === 'login' ? (
            <View style={{ gap: 16 }}>
              <View>
                <Controller
                  control={loginForm.control}
                  name="phone"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={{
                        paddingLeft: 48,
                        paddingRight: 16,
                        paddingVertical: 16,
                        backgroundColor: '#F8FAFC',
                        borderWidth: 1,
                        borderColor: loginForm.formState.errors.phone ? Colors.danger : '#E5E7EB',
                        borderRadius: 16,
                        fontSize: 14,
                      }}
                      placeholder="请输入手机号"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="phone-pad"
                      maxLength={11}
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
                <Text style={{ position: 'absolute', left: 16, top: 18, fontSize: 18 }}>📱</Text>
              </View>
              <View>
                <Controller
                  control={loginForm.control}
                  name="password"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={{
                        paddingLeft: 48,
                        paddingRight: 16,
                        paddingVertical: 16,
                        backgroundColor: '#F8FAFC',
                        borderWidth: 1,
                        borderColor: loginForm.formState.errors.password ? Colors.danger : '#E5E7EB',
                        borderRadius: 16,
                        fontSize: 14,
                      }}
                      placeholder="请输入密码"
                      placeholderTextColor={Colors.textMuted}
                      secureTextEntry
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
                <Text style={{ position: 'absolute', left: 16, top: 18, fontSize: 18 }}>🔒</Text>
              </View>
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              <View>
                <Controller
                  control={registerForm.control}
                  name="phone"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={{
                        paddingLeft: 48,
                        paddingRight: 16,
                        paddingVertical: 16,
                        backgroundColor: '#F8FAFC',
                        borderWidth: 1,
                        borderColor: registerForm.formState.errors.phone ? Colors.danger : '#E5E7EB',
                        borderRadius: 16,
                        fontSize: 14,
                      }}
                      placeholder="请输入手机号"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="phone-pad"
                      maxLength={11}
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
                <Text style={{ position: 'absolute', left: 16, top: 18, fontSize: 18 }}>📱</Text>
              </View>
              <View>
                <Controller
                  control={registerForm.control}
                  name="full_name"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={{
                        paddingLeft: 48,
                        paddingRight: 16,
                        paddingVertical: 16,
                        backgroundColor: '#F8FAFC',
                        borderWidth: 1,
                        borderColor: registerForm.formState.errors.full_name ? Colors.danger : '#E5E7EB',
                        borderRadius: 16,
                        fontSize: 14,
                      }}
                      placeholder="请输入姓名"
                      placeholderTextColor={Colors.textMuted}
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
                <Text style={{ position: 'absolute', left: 16, top: 18, fontSize: 18 }}>👤</Text>
              </View>
              <View>
                <Controller
                  control={registerForm.control}
                  name="password"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={{
                        paddingLeft: 48,
                        paddingRight: 16,
                        paddingVertical: 16,
                        backgroundColor: '#F8FAFC',
                        borderWidth: 1,
                        borderColor: registerForm.formState.errors.password ? Colors.danger : '#E5E7EB',
                        borderRadius: 16,
                        fontSize: 14,
                      }}
                      placeholder="请输入密码"
                      placeholderTextColor={Colors.textMuted}
                      secureTextEntry
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
                <Text style={{ position: 'absolute', left: 16, top: 18, fontSize: 18 }}>🔒</Text>
              </View>
            </View>
          )}

          {/* 错误提示 */}
          {error && (
            <View style={{ marginTop: 16, padding: 12, backgroundColor: '#FEF2F2', borderRadius: 12 }}>
              <Text style={{ color: Colors.danger, fontSize: 13, textAlign: 'center' }}>{error}</Text>
            </View>
          )}

          {/* 忘记密码 */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingHorizontal: 4 }}>
            <Text style={{ fontSize: 12, color: Colors.textMuted, fontWeight: '500' }}></Text>
            <TouchableOpacity>
              <Text style={{ fontSize: 12, color: Colors.primary, fontWeight: '700' }}>忘记密码？</Text>
            </TouchableOpacity>
          </View>

          {/* 提交按钮 */}
          <TouchableOpacity
            style={{
              marginTop: 24,
              paddingVertical: 16,
              backgroundColor: Colors.primary,
              borderRadius: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: loading ? 0.7 : 1,
            }}
            onPress={mode === 'login' ? loginForm.handleSubmit(handleLogin) : registerForm.handleSubmit(handleRegister)}
            disabled={loading}
          >
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>
              {loading ? '处理中...' : mode === 'login' ? '立即登录' : '完成注册'}
            </Text>
            {!loading && <Text style={{ color: 'white', fontSize: 16 }}>→</Text>}
          </TouchableOpacity>

          {/* 第三方登录 */}
          <View style={{ marginTop: 48 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
              <Text style={{ marginHorizontal: 16, fontSize: 10, color: Colors.textMuted, fontWeight: '700', letterSpacing: 1 }}>
                快捷登录方式
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 24 }}>
              <TouchableOpacity
                style={{
                  width: 56,
                  height: 56,
                  backgroundColor: 'white',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 28 }}>💚</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  width: 56,
                  height: 56,
                  backgroundColor: 'white',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 24 }}>🍎</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  width: 56,
                  height: 56,
                  backgroundColor: 'white',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 24 }}>🔍</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 协议 */}
          <View style={{ paddingVertical: 32, alignItems: 'center' }}>
            <Text style={{ fontSize: 10, color: Colors.textMuted, textAlign: 'center', lineHeight: 16 }}>
              登录即代表您同意{' '}
              <Text style={{ color: Colors.primary, fontWeight: '700', textDecorationLine: 'underline' }}>
                服务协议
              </Text>{' '}
              与{' '}
              <Text style={{ color: Colors.primary, fontWeight: '700', textDecorationLine: 'underline' }}>
                隐私政策
              </Text>
              {'\n'}© 2026 寓管家 Pro. 保留所有权利
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
