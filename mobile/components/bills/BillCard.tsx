import { View, Text, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { type BillWithDetails } from '@/services/api'
import { Colors } from '@/constants'

interface BillCardProps {
  bill: BillWithDetails
  onCollect: () => void
  isCollecting: boolean
}

const statusConfig: Record<string, { label: string; bgColor: string; textColor: string; icon: string }> = {
  pending: { label: '待支付', bgColor: '#FFF7ED', textColor: Colors.warning, icon: '📄' },
  partial: { label: '部分支付', bgColor: '#EFF6FF', textColor: Colors.primary, icon: '💰' },
  paid: { label: '已支付', bgColor: '#ECFDF5', textColor: Colors.success, icon: '✓' },
  overdue: { label: '逾期', bgColor: '#FEF2F2', textColor: Colors.danger, icon: '⚠️' },
}

export function BillCard({ bill, onCollect, isCollecting }: BillCardProps) {
  const status = statusConfig[bill.status as keyof typeof statusConfig] || statusConfig.pending
  const roomNumber = bill.lease?.room?.room_number || '未知'
  const tenantName = bill.lease?.tenant?.name || '未知'

  return (
    <TouchableOpacity
      style={{
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#F3F4F6',
      }}
      onPress={() => router.push(`/bills/${bill.id}` as any)}
    >
      {/* 头部 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 40,
              height: 40,
              backgroundColor: status.bgColor,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 18 }}>{status.icon}</Text>
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary }}>{roomNumber}</Text>
            <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 2 }}>{tenantName}</Text>
          </View>
        </View>
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            backgroundColor: status.bgColor,
            borderRadius: 12,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: '700', color: status.textColor }}>{status.label}</Text>
        </View>
      </View>

      {/* 账单明细 */}
      <View style={{ gap: 8, marginBottom: 16 }}>
        <DetailRow label="账单月份" value={`${bill.bill_year}年${bill.bill_month}月`} />
        <DetailRow label="租金" value={`¥${bill.rent_amount?.toFixed(2) || '0.00'}`} />
        <DetailRow label="水费" value={`¥${bill.water_amount?.toFixed(2) || '0.00'}`} />
        <DetailRow label="电费" value={`¥${bill.electricity_amount?.toFixed(2) || '0.00'}`} />
      </View>

      {/* 底部 */}
      <View style={{ borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 18, fontWeight: '900', color: status.textColor }}>
          ¥{bill.total_amount?.toFixed(2)}
        </Text>
        {bill.status !== 'paid' ? (
          <TouchableOpacity
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: Colors.primary,
              borderRadius: 8,
            }}
            onPress={onCollect}
          >
            <Text style={{ color: 'white', fontSize: 10, fontWeight: '700' }}>
              {isCollecting ? '登记中...' : '确认收款'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 10, color: Colors.textMuted }}>已支付</Text>
            <Text style={{ fontSize: 16, color: Colors.success }}>✓</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ fontSize: 11, color: Colors.textMuted }}>{label}</Text>
      <Text style={{ fontSize: 11, color: Colors.textPrimary, fontWeight: '500' }}>{value}</Text>
    </View>
  )
}
