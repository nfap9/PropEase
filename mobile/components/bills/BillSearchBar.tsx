import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import { Colors } from '@/constants'

interface BillSearchBarProps {
  value: string
  onChangeText: (text: string) => void
  onCustomerPress?: () => void
}

export function BillSearchBar({ value, onChangeText, onCustomerPress }: BillSearchBarProps) {
  return (
    <View
      style={{
        backgroundColor: Colors.primary,
        paddingTop: 24,
        paddingBottom: 32,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: '900', color: 'white', letterSpacing: -0.5 }}>
          账单管理
        </Text>
        {onCustomerPress && (
          <TouchableOpacity
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}
            onPress={onCustomerPress}
          >
            <Text style={{ fontSize: 12, color: 'white', marginRight: 4 }}>👥</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: 'white' }}>客户</Text>
          </TouchableOpacity>
        )}
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.2)',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.2)',
          paddingHorizontal: 16,
        }}
      >
        <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
        <TextInput
          style={{
            flex: 1,
            paddingVertical: 12,
            fontSize: 14,
            color: 'white',
            backgroundColor: 'transparent',
          }}
          placeholder="搜索租客或房间号"
          placeholderTextColor="rgba(255,255,255,0.7)"
          value={value}
          onChangeText={onChangeText}
        />
      </View>
    </View>
  )
}
