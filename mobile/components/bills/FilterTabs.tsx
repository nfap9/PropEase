import { View, Text, TouchableOpacity } from 'react-native'
import { Colors } from '@/constants'

export type BillFilter = 'all' | 'pending' | 'paid' | 'overdue'

interface FilterTabsProps {
  filter: BillFilter
  onFilterChange: (filter: BillFilter) => void
}

const filterButtons: { key: BillFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待支付' },
  { key: 'paid', label: '已支付' },
  { key: 'overdue', label: '逾期' },
]

export function FilterTabs({ filter, onFilterChange }: FilterTabsProps) {
  return (
    <View style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', marginTop: 16 }}>
      <View style={{ flexDirection: 'row', paddingHorizontal: 20 }}>
        {filterButtons.map((btn) => (
          <TouchableOpacity
            key={btn.key}
            style={{
              flex: 1,
              paddingVertical: 16,
              alignItems: 'center',
              borderBottomWidth: 2,
              borderBottomColor: filter === btn.key ? Colors.primary : 'transparent',
            }}
            onPress={() => onFilterChange(btn.key)}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: filter === btn.key ? Colors.primary : Colors.textMuted,
              }}
            >
              {btn.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}
