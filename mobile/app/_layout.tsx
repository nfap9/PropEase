import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import 'react-native-reanimated'
import { TamaguiProvider, Theme } from 'tamagui'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { useColorScheme } from '@/components/useColorScheme'
import { AuthGuard } from '@/components/layout'
import { config } from '../tamagui.config'

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router'

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

// TanStack Query 配置
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 分钟
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  })

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error
  }, [error])

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync()
    }
  }, [loaded])

  if (!loaded) {
    return null
  }

  return <RootLayoutNav />
}

function RootLayoutNav() {
  const colorScheme = useColorScheme()

  return (
    <QueryClientProvider client={queryClient}>
      <TamaguiProvider config={config} defaultTheme={colorScheme === 'dark' ? 'dark' : 'light'}>
        <Theme name={colorScheme === 'dark' ? 'dark' : 'light'}>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <AuthGuard>
              <Stack>
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
              </Stack>
            </AuthGuard>
          </ThemeProvider>
        </Theme>
      </TamaguiProvider>
    </QueryClientProvider>
  )
}
