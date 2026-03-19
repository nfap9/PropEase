import { View, Text, TouchableOpacity } from 'react-native'
import { Colors } from '@/constants'

type QueueStatus = 'pending' | 'upcoming' | 'overdue' | 'entered'

function getStatusMeta(status: QueueStatus) {
  switch (status) {
    case 'overdue':
      return { label: '已逾期', textColor: Colors.danger, bgColor: '#FEF2F2', icon: '🔴' }
    case 'upcoming':
      return { label: '即将抄表', textColor: Colors.warning, bgColor: '#FFF7ED', icon: '🟠' }
    case 'entered':
      return { label: '已录入', textColor: Colors.success, bgColor: '#ECFDF5', icon: '✅' }
    default:
      return { label: '待抄表', textColor: Colors.primary, bgColor: '#EFF6FF', icon: '🔵' }
  }
}

function formatReading(value: number | null): string {
  if (value == null || Number.isNaN(value)) return '--'
  return value.toFixed(2)
}

type QueueItem = {
  roomId: string
  readingId?: string
  apartmentId?: string
  apartmentName: string
  roomNumber: string
  tenantName: string
  tenantPhone: string
  billingDay: number
  status: QueueStatus
  waterPrevious: number | null
  electricityPrevious: number | null
}

export function QueueCard({
  item,
  selected,
  onPress,
}: {
  item: QueueItem
  selected: boolean
  onPress: () => void
}) {
  const meta = getStatusMeta(item.status)

  return (
    <TouchableOpacity
      style={{
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 16,
        borderWidth: 1.5,
        borderColor: selected ? '#BFDBFE' : Colors.borderLight,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: selected ? 0.08 : 0.03,
        shadowRadius: 6,
        elevation: selected ? 3 : 1,
      }}
      onPress={onPress}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: meta.bgColor,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 18 }}>{meta.icon}</Text>
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.textPrimary }}>
                {item.roomNumber}
              </Text>
              {item.status !== 'entered' ? (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    backgroundColor: Colors.danger,
                    marginLeft: 8,
                  }}
                />
              ) : null}
            </View>
            <Text style={{ marginTop: 2, fontSize: 11, color: Colors.textMuted }}>
              {item.apartmentName}
            </Text>
            <Text style={{ marginTop: 4, fontSize: 12, color: Colors.textSecondary }}>
              {item.tenantName || '未绑定租客'}
            </Text>
          </View>
        </View>

        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 12,
            backgroundColor: meta.bgColor,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '800', color: meta.textColor }}>
            {meta.label}
          </Text>
        </View>
      </View>

      <View
        style={{
          marginTop: 14,
          paddingTop: 14,
          borderTopWidth: 1,
          borderTopColor: Colors.borderLight,
          flexDirection: 'row',
        }}
      >
        <QueueMetric label="上次水表" value={formatReading(item.waterPrevious)} suffix="m3" />
        <QueueMetric label="上次电表" value={formatReading(item.electricityPrevious)} suffix="kWh" />
        <QueueMetric label="出账日" value={`${item.billingDay}`} suffix="日" />
      </View>
    </TouchableOpacity>
  )
}

function QueueMetric({
  label,
  value,
  suffix,
}: {
  label: string
  value: string
  suffix: string
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 11, color: Colors.textMuted }}>{label}</Text>
      <Text style={{ marginTop: 4, fontSize: 13, fontWeight: '700', color: Colors.textPrimary }}>
        {value}
        <Text style={{ fontSize: 11, color: Colors.textMuted }}> {suffix}</Text>
      </Text>
    </View>
  )
}
