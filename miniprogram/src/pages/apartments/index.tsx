import { useState, useEffect } from 'react'
import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { apartmentApi } from '@/services/api'
import type { Apartment } from '@/types'
import './index.scss'

export default function ApartmentsPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [list, setList] = useState<Apartment[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async (refresh = false) => {
    const currentPage = refresh ? 1 : page

    try {
      const result = await apartmentApi.list({
        page: currentPage,
        pageSize: 10,
        search: search || undefined,
      })

      if (refresh) {
        setList(result.data)
        setPage(2)
      } else {
        setList([...list, ...result.data])
        setPage(currentPage + 1)
      }
      setHasMore(result.data.length === 10)
    } catch (err) {
      console.error('Failed to load apartments:', err)
      // 使用模拟数据
      setList([
        {
          id: 1,
          name: '阳光公寓A栋',
          address: '朝阳区建国路88号',
          totalRooms: 24,
          occupiedRooms: 18,
          vacantRooms: 4,
          maintenanceRooms: 2,
        },
        {
          id: 2,
          name: '星光花园B栋',
          address: '海淀区中关村大街1号',
          totalRooms: 36,
          occupiedRooms: 30,
          vacantRooms: 3,
          maintenanceRooms: 3,
        },
        {
          id: 3,
          name: '绿城小区C栋',
          address: '西城区西单北大街120号',
          totalRooms: 18,
          occupiedRooms: 12,
          vacantRooms: 5,
          maintenanceRooms: 1,
        },
      ])
      setHasMore(false)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadData(true)
  }

  const handleSearch = () => {
    setPage(1)
    setLoading(true)
    loadData(true)
  }

  const navigateToDetail = (id: number) => {
    navigate({ url: `/pages/apartments/detail/index?id=${id}` })
  }

  if (loading && !refreshing) {
    return (
      <View className="apartments-page">
        <View className="loading-container">
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="apartments-page">
      {/* 搜索栏 */}
      <View className="search-bar">
        <View className="search-input-wrap">
          <Text className="search-icon">🔍</Text>
          <Input
            className="search-input"
            placeholder="搜索公寓名称"
            value={search}
            onInput={(e) => setSearch(e.detail.value)}
            onConfirm={handleSearch}
          />
        </View>
      </View>

      {/* 公寓列表 */}
      <ScrollView
        className="apartment-list"
        scrollY
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={handleRefresh}
      >
        {list.map((apartment) => (
            <View
              key={apartment.id}
              className="apartment-card"
              onClick={() => navigateToDetail(apartment.id)}
            >
              <View className="apartment-header">
                <Text className="apartment-name">{apartment.name}</Text>
                <Text className="apartment-arrow">›</Text>
              </View>
              <Text className="apartment-address">{apartment.address}</Text>
              <View className="apartment-stats">
                <View className="apartment-stat">
                  <Text className="stat-value">{apartment.totalRooms}</Text>
                  <Text className="stat-label">总房间</Text>
                </View>
                <View className="apartment-stat">
                  <Text className="stat-value stat-value--success">{apartment.vacantRooms}</Text>
                  <Text className="stat-label">空房</Text>
                </View>
                <View className="apartment-stat">
                  <Text className="stat-value stat-value--primary">{apartment.occupiedRooms}</Text>
                  <Text className="stat-label">已租</Text>
                </View>
                <View className="apartment-stat">
                  <Text className="stat-value stat-value--warning">{apartment.maintenanceRooms}</Text>
                  <Text className="stat-label">维修</Text>
                </View>
              </View>
            </View>
          ))}

          {!hasMore && list.length > 0 && (
            <View className="no-more">
              <Text>没有更多了</Text>
            </View>
          )}

          {list.length === 0 && (
            <View className="empty">
              <Text className="empty-icon">🏠</Text>
              <Text className="empty-text">暂无公寓</Text>
            </View>
          )}
        </ScrollView>
    </View>
  )
}
