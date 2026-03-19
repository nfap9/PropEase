import { View, Text, TouchableOpacity } from 'react-native'
import { Colors } from '@/constants'

type FilterType = 'all' | 'pending' | 'entered'

export function FilterTabs({
  filter,
  onFilterChange,
}: {
  filter: FilterType
  onFilterChange: (f: FilterType) => void
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
      {([
        ['pending', '待抄表'],
        ['entered', '已录入'],
        ['all', '全部'],
      ] as const).map(([value, label]) => (
        <TouchableOpacity
          key={value}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 9,
            borderRadius: 999,
            backgroundColor: filter === value ? Colors.primary : 'white',
            borderWidth: filter === value ? 0 : 1,
            borderColor: Colors.border,
          }}
          onPress={() => onFilterChange(value)}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: filter === value ? 'white' : Colors.textSecondary,
            }}
          >
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

export function ApartmentFilterPill({
  label,
  selected,
  onPress,
}: {
  label: string
  selected: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      style={{
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 999,
        backgroundColor: selected ? '#DBEAFE' : 'white',
        borderWidth: 1,
        borderColor: selected ? '#BFDBFE' : Colors.borderLight,
      }}
      onPress={onPress}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: '700',
          color: selected ? Colors.primary : Colors.textSecondary,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  )
}

export function SummaryChip({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'warning' | 'success' | 'danger'
}) {
  const toneMap = {
    warning: { bg: 'rgba(255,255,255,0.16)', valueColor: 'white', labelColor: 'rgba(255,255,255,0.72)' },
    success: { bg: 'rgba(255,255,255,0.16)', valueColor: 'white', labelColor: 'rgba(255,255,255,0.72)' },
    danger: { bg: 'rgba(255,255,255,0.16)', valueColor: 'white', labelColor: 'rgba(255,255,255,0.72)' },
  } as const

  return (
    <View
      style={{
        flex: 1,
        borderRadius: 18,
        backgroundColor: toneMap[tone].bg,
        paddingVertical: 12,
        paddingHorizontal: 14,
      }}
    >
      <Text style={{ fontSize: 22, fontWeight: '900', color: toneMap[tone].valueColor }}>{value}</Text>
      <Text style={{ marginTop: 3, fontSize: 11, color: toneMap[tone].labelColor }}>{label}</Text>
    </View>
  )
}
