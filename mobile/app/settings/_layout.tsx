import { Stack } from 'expo-router'
import { Colors } from '@/constants'

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="fee-configs" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="notifications" />
    </Stack>
  )
}
