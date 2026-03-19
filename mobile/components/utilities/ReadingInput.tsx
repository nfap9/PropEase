import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native'
import { Colors } from '@/constants'

function formatMoney(value: number | null): string {
  if (value == null || Number.isNaN(value)) return '--'
  return value.toFixed(2)
}

function formatReading(value: number | null): string {
  if (value == null || Number.isNaN(value)) return '--'
  return value.toFixed(2)
}

function sanitizeNumericInput(value: string): string {
  return value.replace(/[^0-9.]/g, '')
}

export function MeterInputCard({
  title,
  unit,
  previous,
  price,
  value,
  usage,
  fee,
  onChange,
}: {
  title: string
  unit: string
  previous: number | null
  price: number | null
  value: string
  usage: number | null
  fee: number | null
  onChange: (value: string) => void
}) {
  return (
    <View
      style={{
        backgroundColor: '#F8FAFC',
        borderRadius: 22,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.borderLight,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.textPrimary }}>{title}</Text>
        <Text style={{ fontSize: 11, color: Colors.textMuted }}>
          上次读数 {formatReading(previous)} {unit}
        </Text>
      </View>

      <View
        style={{
          marginTop: 12,
          borderRadius: 20,
          backgroundColor: 'white',
          borderWidth: 1,
          borderColor: Colors.border,
          paddingHorizontal: 18,
          paddingVertical: 14,
        }}
      >
        <Text style={{ fontSize: 11, color: Colors.textMuted }}>当前读数</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
          <TextInput
            style={{
              flex: 1,
              fontSize: 36,
              fontWeight: '900',
              color: Colors.textPrimary,
              paddingVertical: 0,
            }}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor="#CBD5E1"
            value={value}
            onChangeText={(nextValue) => onChange(sanitizeNumericInput(nextValue))}
          />
          <Text style={{ marginLeft: 8, fontSize: 14, fontWeight: '700', color: Colors.textMuted }}>
            {unit}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', marginTop: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: Colors.textMuted }}>本次用量</Text>
          <Text style={{ marginTop: 4, fontSize: 16, fontWeight: '800', color: Colors.textPrimary }}>
            {usage != null ? usage.toFixed(2) : '--'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: Colors.textMuted }}>单价</Text>
          <Text style={{ marginTop: 4, fontSize: 16, fontWeight: '800', color: Colors.textPrimary }}>
            {price != null ? `¥${price.toFixed(2)}` : '--'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: Colors.textMuted }}>费用</Text>
          <Text style={{ marginTop: 4, fontSize: 16, fontWeight: '800', color: Colors.primary }}>
            {fee != null ? `¥${formatMoney(fee)}` : '--'}
          </Text>
        </View>
      </View>
    </View>
  )
}

export function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingBottom: last ? 0 : 10,
        marginBottom: last ? 0 : 10,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: Colors.borderLight,
      }}
    >
      <Text style={{ fontSize: 12, color: Colors.textMuted }}>{label}</Text>
      <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.textPrimary }}>{value}</Text>
    </View>
  )
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 36 }}>
      <Text style={{ fontSize: 42 }}>{icon}</Text>
      <Text
        style={{
          marginTop: 12,
          fontSize: 16,
          fontWeight: '800',
          color: Colors.textPrimary,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          marginTop: 6,
          fontSize: 12,
          lineHeight: 18,
          color: Colors.textMuted,
          textAlign: 'center',
        }}
      >
        {description}
      </Text>
    </View>
  )
}
