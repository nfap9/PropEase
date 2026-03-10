import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { apartmentApi } from '@/services/api'
import type { ApartmentWithStats } from '@apartment-ultra/api-contract'
import './index.scss'

export default function ApartmentDetailPage() {
  const routerParams = Taro.getRouterParams()
  const id = routerParams?.id
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ApartmentWithStats | null>(null)

  useEffect(() => {
    if (id) {
      loadData(Number(id))
    }
  }, [id])

  const loadData = async (apartmentId: number) => {
    try {
      const result = await apartmentApi.getById(apartmentId)
      setData(result)
    } catch (err) {
      console.error('Failed to load apartment:', err)
      // 使用模拟数据
      setData({
        id: apartmentId,
        name: '阳光公寓A栋',
        address: '朝阳区建国路88号',
        totalRooms: 24,
        occupiedRooms: 18,
        vacantRooms: 4,
        maintenanceRooms: 2,
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View className="apartment-detail">
        <View className="loading-container">
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  if (!data) {
    return (
      <View className="apartment-detail">
        <View className="empty">公寓不存在</View>
      </View>
    )
  }

  return (
    <ScrollView className="apartment-detail" scrollY>
      {/* 头部信息 */}
      <View className="detail-header">
        <Text className="detail-name">{data.name}</Text>
        <Text className="detail-address">{data.address}</Text>
      </View>

      {/* 统计卡片 */}
      <View className="stats-section">
        <View className="stats-card">
          <View className="stat-item">
            <Text className="stat-value">{data.totalRooms}</Text>
            <Text className="stat-label">总房间</Text>
          </View>
          <View className="stat-item">
            <Text className="stat-value stat-value--success">{data.vacantRooms}</Text>
            <Text className="stat-label">空房</Text>
          </View>
          <View className="stat-item">
            <Text className="stat-value stat-value--primary">{data.occupiedRooms}</Text>
            <Text className="stat-label">已租</Text>
          </View>
          <View className="stat-item">
            <Text className="stat-value stat-value--warning">{data.maintenanceRooms}</Text>
            <Text className="stat-label">维修</Text>
          </View>
        </View>
      </View>

      {/* 房间列表入口 */}
      <View className="section">
        <View className="section-header">
          <Text className="section-title">房间列表</Text>
        </View>
        <View className="room-preview">
          <View className="room-preview-item">
            <Text className="preview-label">空房</Text>
            <Text className="preview-value preview-value--success">{data.vacantRooms}</Text>
          </View>
          <View className="room-preview-item">
            <Text className="preview-label">已租</Text>
            <Text className="preview-value preview-value--primary">{data.occupiedRooms}</Text>
          </View>
          <View className="room-preview-item">
            <Text className="preview-label">维修</Text>
            <Text className="preview-value preview-value--warning">{data.maintenanceRooms}</Text>
          </View>
        </View>
      </View>

      {/* 操作按钮 */}
      <View className="actions">
        <View className="action-btn action-btn--primary">查看房间</View>
        <View className="action-btn">编辑公寓</View>
      </View>
    </ScrollView>
  )
}
