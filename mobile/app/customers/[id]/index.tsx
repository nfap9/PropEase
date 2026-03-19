import { View, Text } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { Colors } from '@/constants'

/** 租客详情页 (stub) */
export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 18, color: Colors.textMuted }}>租客详情: {id}</Text>
      </View>
    </View>
  )
}
