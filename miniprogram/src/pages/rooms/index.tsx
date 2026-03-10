import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { roomApi } from '@/services/api'
import type { Room } from '@apartment-ultra/api-contract'
import './index.scss'

type FilterType = 'all' | 'vacant' | 'occupied' | 'maintenance'

export default function RoomsPage() {
  const routerParams = Taro.getRouterParams()
  const apartmentId = routerParams?.apartmentId
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')
  const [list, setList] = useState<Room[]>([])

  useEffect(() => {
    loadData()
  }, [filter, apartmentId])

  const loadData = async () => {
    try {
      const params: any = {
        page: 1,
        pageSize: 50,
      }
      if (apartmentId) params.apartmentId = apartmentId
      if (filter !== 'all') params.status = filter

      const result = await roomApi.list(params)
      setList(result.data)
    } catch (err) {
      console.error('Failed to load rooms:', err)
      // 模拟数据
      setList([
        { id: 1, number: '101', apartmentId: 1, apartmentName: '阳光公寓A栋', status: 'occupied', floor: 1 },
        { id: 2, number: '102', apartmentId: 1, apartmentName: '阳光公寓A栋', status: 'occupied', floor: 1 },
        { id: 3, number: '103', apartmentId: 1, apartmentName: '阳光公寓A栋', status: 'vacant', floor: 1 },
        { id: 4, number: '104', apartmentId: 1, apartmentName: '阳光公寓A栋', status: 'maintenance', floor: 1 },
        { id: 5, number: '201', apartmentId: 1, apartmentName: '阳光公寓A栋', status: 'occupied', floor: 2 },
        { id: 6, number: '202', apartmentId: 1, apartmentName: '阳光公寓A栋', status: 'vacant', floor: 2 },
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'vacant': return '空房'
      case 'occupied': return '已租'
      case 'maintenance': return '维修'
      default: return status
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'vacant': return 'tag--empty'
      case 'occupied': return 'tag--rented'
      case 'maintenance': return 'tag--maintenance'
      default: return ''
    }
  }

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'vacant', label: '空房' },
    { key: 'occupied', label: '已租' },
    { key: 'maintenance', label: '维修' },
  ]

  if (loading && !refreshing) {
    return (
      <View className="rooms-page">
        <View className="loading-container">
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="rooms-page">
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

      {/* 房间列表 */}
      <ScrollView
        className="room-list"
        scrollY
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={handleRefresh}
      >
        {list.map((room) => (
            <View key={room.id} className="room-card">
              <View className="room-info">
                <Text className="room-number">{room.number}</Text>
                <Text className="room-apartment">{room.apartmentName}</Text>
              </View>
              <View className="room-right">
                <Text className={`tag ${getStatusClass(room.status)}`}>
                  {getStatusText(room.status)}
                </Text>
                <Text className="room-arrow">›</Text>
              </View>
            </View>
          ))}

          {list.length === 0 && (
            <View className="empty">
              <Text className="empty-icon">🚪</Text>
              <Text className="empty-text">暂无房间</Text>
            </View>
          )}
        </ScrollView>
    </View>
  )
}
