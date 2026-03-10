import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { billApi } from '@/services/api'
import type { Bill } from '@apartment-ultra/api-contract'
import './index.scss'

type FilterType = 'all' | 'pending' | 'paid' | 'overdue'

export default function BillsPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')
  const [list, setList] = useState<Bill[]>([])

  useEffect(() => {
    loadData()
  }, [filter])

  const loadData = async () => {
    try {
      const result = await billApi.list({
        status: filter === 'all' ? undefined : filter,
      })
      setList(result.data)
    } catch (err) {
      console.error('Failed to load bills:', err)
      // 模拟数据
      setList([
        {
          id: 1,
          billNo: 'BILL202403001',
          tenantName: '张三',
          roomNumber: '101',
          amount: 3500,
          status: 'pending',
          dueDate: '2024-03-31',
        },
        {
          id: 2,
          billNo: 'BILL202403002',
          tenantName: '李四',
          roomNumber: '102',
          amount: 4200,
          status: 'paid',
          dueDate: '2024-03-31',
        },
        {
          id: 3,
          billNo: 'BILL202403003',
          tenantName: '王五',
          roomNumber: '103',
          amount: 2800,
          status: 'overdue',
          dueDate: '2024-02-28',
        },
        {
          id: 4,
          billNo: 'BILL202403004',
          tenantName: '赵六',
          roomNumber: '201',
          amount: 3600,
          status: 'pending',
          dueDate: '2024-03-31',
        },
      ])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  const formatMoney = (amount: number) => {
    return `¥${amount.toLocaleString()}`
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待支付'
      case 'paid': return '已支付'
      case 'overdue': return '已逾期'
      default: return status
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending': return 'tag--warning'
      case 'paid': return 'tag--success'
      case 'overdue': return 'tag--danger'
      default: return ''
    }
  }

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待支付' },
    { key: 'paid', label: '已支付' },
    { key: 'overdue', label: '已逾期' },
  ]

  if (loading && !refreshing) {
    return (
      <View className="bills-page">
        <View className="loading-container">
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="bills-page">
      {/* 筛选标签 */}
      <ScrollView className="filter-bar" scrollX>
        {filters.map((item) => (
          <View
            key={item.key}
            className={`filter-tag ${filter === item.key ? 'filter-tag--active' : ''}`}
            onClick={() => setFilter(item.key)}
          >
            {item.label}
          </View>
        ))}
      </ScrollView>

      {/* 账单列表 */}
      <ScrollView
        className="bill-list"
        scrollY
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={handleRefresh}
      >
        {list.map((bill) => (
            <View key={bill.id} className="bill-card">
              <View className="bill-header">
                <Text className="bill-no">{bill.billNo}</Text>
                <Text className={`tag ${getStatusClass(bill.status)}`}>
                  {getStatusText(bill.status)}
                </Text>
              </View>
              <View className="bill-info">
                <Text className="bill-tenant">{bill.tenantName}</Text>
                <Text className="bill-room">房间 {bill.roomNumber}</Text>
              </View>
              <View className="bill-footer">
                <Text className="bill-amount">{formatMoney(bill.amount)}</Text>
                {bill.status === 'pending' && (
                  <View className="bill-pay-btn">
                    <Text>立即支付</Text>
                  </View>
                )}
              </View>
            </View>
          ))}

          {list.length === 0 && (
            <View className="empty">
              <Text className="empty-icon">📄</Text>
              <Text className="empty-text">暂无账单</Text>
            </View>
          )}
        </ScrollView>
    </View>
  )
}
