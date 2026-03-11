import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { router, useSegments } from 'expo-router'
import { useAuth } from '@/hooks'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading, initialize } = useAuth()
  const segments = useSegments()

  useEffect(() => {
    initialize()
  }, [])

  useEffect(() => {
    if (isLoading) return

    const inAuthGroup = segments[0] === 'login'

    if (!isAuthenticated && !inAuthGroup) {
      // 未登录且不在登录页，跳转到登录页
      router.replace('/login')
    } else if (isAuthenticated && inAuthGroup) {
      // 已登录但在登录页，跳转到首页
      router.replace('/')
    }
  }, [isAuthenticated, isLoading, segments])

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    )
  }

  return <>{children}</>
}

export default AuthGuard
