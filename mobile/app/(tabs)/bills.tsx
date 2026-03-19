import { Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { billsApi, type BillWithDetails } from '@/services/api'
import { Colors } from '@/constants'
import { useState } from 'react'
import { BillCard, FilterTabs, BillSearchBar } from '@/components/bills'
import type { BillFilter } from '@/components/bills'

export default function BillsScreen() {
  const queryClient = useQueryClient()
  const [searchText, setSearchText] = useState('')
  const [filter, setFilter] = useState<BillFilter>('all')

  const { data: bills, isLoading, refetch } = useQuery({
    queryKey: ['bills', filter],
    queryFn: () => billsApi.list({ status: filter === 'all' ? undefined : filter }),
  })

  const collectMutation = useMutation({
    mutationFn: async (bill: BillWithDetails) => {
      const unpaidAmount = Math.max(0, Number(bill.total_amount || 0) - Number(bill.paid_amount || 0))
      if (unpaidAmount <= 0) {
        throw new Error('该账单已无待收金额')
      }

      return billsApi.addPayment(bill.id, {
        amount: unpaidAmount,
        payment_method: 'cash',
        payment_date: new Date().toISOString().slice(0, 10),
        notes: '移动端快捷收款登记',
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bills'] })
      Alert.alert('收款成功', '账单状态已更新。')
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '收款失败，请稍后重试'
      Alert.alert('收款失败', message)
    },
  })

  const handleQuickCollect = (bill: BillWithDetails) => {
    const unpaidAmount = Math.max(0, Number(bill.total_amount || 0) - Number(bill.paid_amount || 0))

    if (unpaidAmount <= 0) {
      Alert.alert('无需收款', '这笔账单已经全部支付。')
      return
    }

    Alert.alert(
      '确认收款',
      `将登记收款 ¥${unpaidAmount.toFixed(2)}，并把账单更新为最新状态。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认',
          onPress: () => collectMutation.mutate(bill),
        },
      ]
    )
  }

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

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* 顶部搜索区 */}
      <BillSearchBar
        value={searchText}
        onChangeText={setSearchText}
        onCustomerPress={() => router.push('/customers')}
      />

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
      <FilterTabs filter={filter} onFilterChange={setFilter} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[Colors.primary]} />
        }
      >
        {filteredBills && filteredBills.length > 0 ? (
          filteredBills.map((bill: BillWithDetails) => (
            <BillCard
              key={bill.id}
              bill={bill}
              onCollect={() => handleQuickCollect(bill)}
              isCollecting={collectMutation.isPending && collectMutation.variables?.id === bill.id}
            />
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
