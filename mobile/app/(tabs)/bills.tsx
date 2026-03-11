import { View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { billsApi, type BillWithDetails } from '@/services/api'
import { Colors } from '@/constants'
import { useState } from 'react'

type BillFilter = 'all' | 'pending' | 'paid' | 'overdue'

export default function BillsScreen() {
  const [searchText, setSearchText] = useState('')
  const [filter, setFilter] = useState<BillFilter>('all')

  const { data: bills, isLoading, refetch } = useQuery({
    queryKey: ['bills', filter],
    queryFn: () => billsApi.list({ status: filter === 'all' ? undefined : filter }),
  })

  // 过滤账单
  const filteredBills = bills?.filter((bill: BillWithDetails) => {
    if (!searchText) return true
    const roomNumber = bill.lease?.room?.room_number || ''
    const tenantName = bill.lease?.tenant?.name || ''
    return roomNumber.includes(searchText) || tenantName.includes(searchText)
  })

  // 统计
  const stats = {
    monthTotal: bills?.reduce((sum: number, bill: BillWithDetails) => sum + (bill.total_amount || 0), 0) || 0,
    paid: bills?.filter((b: BillWithDetails) => b.status === 'paid').reduce((sum: number, b: BillWithDetails) => sum + (b.paid_amount || 0), 0) || 0,
    pending: bills?.filter((b: BillWithDetails) => b.status === 'pending' || b.status === 'overdue').reduce((sum: number, b: BillWithDetails) => sum + ((b.total_amount || 0) - (b.paid_amount || 0)), 0) || 0,
  }

  const filterButtons: { key: BillFilter; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待支付' },
    { key: 'paid', label: '已支付' },
    { key: 'overdue', label: '逾期' },
  ]

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* 顶部搜索区 */}
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
        <Text style={{ fontSize: 24, fontWeight: '900', color: 'white', marginBottom: 16, letterSpacing: -0.5 }}>
          账单管理
        </Text>
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
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {/* 统计概览 */}
      <View style={{ paddingHorizontal: 20, marginTop: -24 }}>
        <View
          style={{
            backgroundColor: 'white',
            borderRadius: 24,
            padding: 16,
            shadowColor: '#1E3A8A',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 4,
            borderWidth: 1,
            borderColor: '#F9FAFB',
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <StatItem label="本月应收" value={`¥${(stats.monthTotal / 10000).toFixed(1)}w`} color={Colors.textPrimary} />
            <StatItem label="已收" value={`¥${(stats.paid / 10000).toFixed(1)}w`} color={Colors.success} />
            <StatItem label="待收" value={`¥${(stats.pending / 10000).toFixed(1)}w`} color={Colors.warning} />
          </View>
        </View>
      </View>

      {/* Tab 切换 */}
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
              onPress={() => setFilter(btn.key)}
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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[Colors.primary]} />
        }
      >
        {filteredBills && filteredBills.length > 0 ? (
          filteredBills.map((bill: BillWithDetails) => (
            <BillCard key={bill.id} bill={bill} />
          ))
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>📄</Text>
            <Text style={{ color: Colors.textMuted, fontWeight: '600' }}>暂无账单数据</Text>
          </View>
        )}
      </ScrollView>

      {/* 悬浮按钮 */}
      <View
        style={{
          position: 'absolute',
          right: 20,
          bottom: 100,
        }}
      >
        <TouchableOpacity
          style={{
            width: 56,
            height: 56,
            backgroundColor: Colors.primary,
            borderRadius: 28,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: Colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Text style={{ fontSize: 24, color: 'white' }}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

// 统计项组件
function StatItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: '900', color }}>{value}</Text>
      <Text style={{ fontSize: 9, color: Colors.textMuted, fontWeight: '500', marginTop: 4 }}>{label}</Text>
    </View>
  )
}

// 账单卡片组件
function BillCard({ bill }: { bill: BillWithDetails }) {
  const statusConfig = {
    pending: { label: '待支付', bgColor: '#FFF7ED', textColor: Colors.warning, icon: '📄' },
    partial: { label: '部分支付', bgColor: '#EFF6FF', textColor: Colors.primary, icon: '💰' },
    paid: { label: '已支付', bgColor: '#ECFDF5', textColor: Colors.success, icon: '✓' },
    overdue: { label: '逾期', bgColor: '#FEF2F2', textColor: Colors.danger, icon: '⚠️' },
  }

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
          >
            <Text style={{ color: 'white', fontSize: 10, fontWeight: '700' }}>催款</Text>
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
