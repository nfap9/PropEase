import { useState, useEffect } from 'react'
import { View, Text, Input, ScrollView } from '@tarojs/components'
import { tenantApi } from '@/services/api'
import type { Tenant } from '@apartment-ultra/api-contract'
import './index.scss'

export default function TenantsPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [list, setList] = useState<Tenant[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const result = await tenantApi.list({
        search: search || undefined,
      })
      setList(result.data)
    } catch (err) {
      console.error('Failed to load tenants:', err)
      // 模拟数据
      setList([
        { id: 1, name: '张三', phone: '13800138000', idCard: '110101199001011234', leaseCount: 1 },
        { id: 2, name: '李四', phone: '13800138001', idCard: '110101199002021234', leaseCount: 2 },
        { id: 3, name: '王五', phone: '13800138002', idCard: '110101199003031234', leaseCount: 1 },
        { id: 4, name: '赵六', phone: '13800138003', idCard: '110101199004041234', leaseCount: 1 },
        { id: 5, name: '钱七', phone: '13800138004', idCard: '110101199005051234', leaseCount: 0 },
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

  const handleSearch = () => {
    setLoading(true)
    loadData()
  }

  const formatPhone = (phone: string) => {
    if (!phone) return ''
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  }

  if (loading && !refreshing) {
    return (
      <View className="tenants-page">
        <View className="loading-container">
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="tenants-page">
      {/* 搜索栏 */}
      <View className="search-bar">
        <View className="search-input-wrap">
          <Text className="search-icon">🔍</Text>
          <Input
            className="search-input"
            placeholder="搜索租客姓名/手机号"
            value={search}
            onInput={(e) => setSearch(e.detail.value)}
            onConfirm={handleSearch}
          />
        </View>
      </View>

      {/* 租客列表 */}
      <ScrollView
        className="tenant-list"
        scrollY
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={handleRefresh}
      >
        {list.map((tenant) => (
            <View key={tenant.id} className="tenant-card">
              <View className="tenant-avatar">
                <Text>{tenant.name?.charAt(0) || '?'}</Text>
              </View>
              <View className="tenant-info">
                <Text className="tenant-name">{tenant.name}</Text>
                <Text className="tenant-phone">{formatPhone(tenant.phone || '')}</Text>
              </View>
              <View className="tenant-meta">
                <Text className="tenant-lease-count">{tenant.leaseCount || 0} 个租约</Text>
                <Text className="tenant-arrow">›</Text>
              </View>
            </View>
          ))}

          {list.length === 0 && (
            <View className="empty">
              <Text className="empty-icon">👥</Text>
              <Text className="empty-text">暂无租客</Text>
            </View>
          )}
        </ScrollView>

      {/* 新增按钮 */}
      <View className="add-btn">
        <Text>+ 新增租客</Text>
      </View>
    </View>
  )
}
