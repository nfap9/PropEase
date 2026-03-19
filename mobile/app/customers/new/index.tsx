import { View, Text } from 'react-native'
import { router } from 'expo-router'
import { Colors } from '@/constants'

/** 新建租客页面 (stub) */
export default function CustomerNewScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 18, color: Colors.textMuted }}>新建租客</Text>
      </View>
    </View>
  )
}
