import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { reportApi } from '@/services/api'
import type { DashboardOverview } from '@/types'
import './index.scss'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardOverview | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const result = await reportApi.getDashboard()
      setData(result)
    } catch (err) {
      console.error('Failed to load dashboard:', err)
      // 使用模拟数据
      setData({
        totalApartments: 12,
        totalRooms: 286,
        occupiedRooms: 198,
        vacantRooms: 68,
        maintenanceRooms: 20,
        totalTenants: 186,
        monthlyIncome: 124000,
        pendingBills: 5,
      })
    } finally {
      setLoading(false)
    }
  }

  const formatMoney = (amount: number) => {
    if (amount >= 10000) {
      return `¥${(amount / 10000).toFixed(1)}w`
    }
    return `¥${amount}`
  }

  const quickActions = [
    { id: 'apartment', name: '公寓', icon: '🏠', path: '/pages/apartments/index' },
    { id: 'room', name: '房间', icon: '🚪', path: '/pages/rooms/index' },
    { id: 'tenant', name: '租客', icon: '👤', path: '/pages/tenants/index' },
    { id: 'lease', name: '租约', icon: '📄', path: '/pages/leases/index' },
    { id: 'bill', name: '账单', icon: '💰', path: '/pages/bills/index' },
    { id: 'utility', name: '水电', icon: '💧', path: '/pages/utilities/index' },
    { id: 'report', name: '报表', icon: '📊', path: '/pages/reports/index' },
    { id: 'settings', name: '设置', icon: '⚙️', path: '/pages/settings/index' },
  ]

  const recentActivities = [
    { id: 1, type: 'apartment', title: '新增公寓 - 阳光公寓A栋', time: '刚刚' },
    { id: 2, type: 'tenant', title: '房间 101 出租给张三', time: '10分钟前' },
    { id: 3, type: 'bill', title: '2月账单已生成', time: '1小时前' },
  ]

  const navigateTo = (path: string) => {
    Taro.navigateTo({ url: path })
  }

  if (loading) {
    return (
      <View className="dashboard">
        <View className="loading-container">
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <ScrollView className="dashboard" scrollY>
      {/* 头部信息区 */}
      <View className="dashboard-header">
        <View className="header-stats">
          <Text className="stats-number">{data?.totalApartments || 0}</Text>
          <Text className="stats-label">个公寓</Text>
        </View>
        <View className="header-cards">
          <View className="header-card">
            <Text className="header-card-label">总房间</Text>
            <Text className="header-card-value">{data?.totalRooms || 0}</Text>
          </View>
          <View className="header-card">
            <Text className="header-card-label">本月收入</Text>
            <Text className="header-card-value">{formatMoney(data?.monthlyIncome || 0)}</Text>
          </View>
        </View>
      </View>

      {/* 统计卡片 */}
      <View className="stats-section">
        <View className="stats-card">
          <View className="stat-item">
            <View className="stat-icon stat-icon--apartment">🏠</View>
            <Text className="stat-label">公寓</Text>
            <Text className="stat-value">{data?.totalApartments || 0}</Text>
          </View>
          <View className="stat-item">
            <View className="stat-icon stat-icon--vacant">🚪</View>
            <Text className="stat-label">空房</Text>
            <Text className="stat-value stat-value--success">{data?.vacantRooms || 0}</Text>
          </View>
          <View className="stat-item">
            <View className="stat-icon stat-icon--occupied">👤</View>
            <Text className="stat-label">已租</Text>
            <Text className="stat-value stat-value--primary">{data?.occupiedRooms || 0}</Text>
          </View>
          <View className="stat-item">
            <View className="stat-icon stat-icon--maintenance">🔧</View>
            <Text className="stat-label">维修</Text>
            <Text className="stat-value stat-value--warning">{data?.maintenanceRooms || 0}</Text>
          </View>
        </View>
      </View>

      {/* 快捷功能 */}
      <View className="section">
        <View className="section-header">
          <Text className="section-title">快捷功能</Text>
          <Text className="section-more">更多</Text>
        </View>
        <View className="quick-actions">
          {quickActions.map((action) => (
            <View
              key={action.id}
              className="quick-action"
              onClick={() => navigateTo(action.path)}
            >
              <View className="quick-action-icon">{action.icon}</View>
              <Text className="quick-action-name">{action.name}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 最近动态 */}
      <View className="section">
        <View className="section-header">
          <Text className="section-title">最近动态</Text>
          <Text className="section-more">查看全部</Text>
        </View>
        <View className="activity-list">
          {recentActivities.map((activity) => (
            <View key={activity.id} className="activity-item">
              <View className="activity-icon">
                {activity.type === 'apartment' && '🏠'}
                {activity.type === 'tenant' && '👤'}
                {activity.type === 'bill' && '💰'}
              </View>
              <View className="activity-content">
                <Text className="activity-title">{activity.title}</Text>
                <Text className="activity-time">{activity.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  )
}
