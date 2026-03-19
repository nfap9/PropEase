import { View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { tenantsApi, type TenantWithLease } from '@/services/api'
import type { Lease } from '@apartment-ultra/api-contract'
import { Colors } from '@/constants'
import { useState } from 'react'

type FilterType = 'all' | 'active' | 'expiring'

export default function CustomersScreen() {
  const [searchText, setSearchText] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')

  const { data: tenants, isLoading, refetch } = useQuery<TenantWithLease[]>({
    queryKey: ['tenants', searchText, filter],
    queryFn: () => tenantsApi.list({ search: searchText || undefined }) as Promise<TenantWithLease[]>,
  })

  // 过滤租客
  const filteredTenants = tenants?.filter((tenant: TenantWithLease) => {
    if (filter === 'all') return true
    if (filter === 'active') {
      return tenant.lease?.some((l: Lease) => l.is_active)
    }
    if (filter === 'expiring') {
      return tenant.lease?.some((l: Lease) => {
        if (!l.end_date || !l.is_active) return false
        const daysUntilExpiry = Math.ceil(
          (new Date(l.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
        return daysUntilExpiry <= 14 && daysUntilExpiry > 0
      })
    }
    return true
  })

  // 统计数据
  const stats = {
    total: tenants?.length || 0,
    active: tenants?.filter((t: TenantWithLease) => t.lease?.some((l: Lease) => l.is_active)).length || 0,
    expiring: tenants?.filter((t: TenantWithLease) =>
      t.lease?.some((l: Lease) => {
        if (!l.end_date || !l.is_active) return false
        const daysUntilExpiry = Math.ceil(
          (new Date(l.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
        return daysUntilExpiry <= 14 && daysUntilExpiry > 0
      })
    ).length || 0,
  }

  const filterButtons: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'active', label: '在租' },
    { key: 'expiring', label: '即将到期' },
  ]

  const getTenantStatus = (tenant: TenantWithLease) => {
    const activeLease = tenant.lease?.find((l: Lease) => l.is_active)
    if (!activeLease) return { label: '未租', color: Colors.textMuted, bgColor: '#F3F4F6' }

    if (activeLease.end_date) {
      const daysUntilExpiry = Math.ceil(
        (new Date(activeLease.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      if (daysUntilExpiry <= 14 && daysUntilExpiry > 0) {
        return { label: '即将到期', color: Colors.warning, bgColor: '#FFF7ED' }
      }
    }
    return { label: '在租', color: Colors.success, bgColor: '#ECFDF5' }
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* 顶部搜索区 */}
      <View style={{ backgroundColor: Colors.primary, paddingTop: 48, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 }}>
        <Text style={{ fontSize: 24, fontWeight: '900', color: 'white', marginBottom: 16 }}>
          客户管理
        </Text>

        {/* 搜索框 */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'white',
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={{ flex: 1, fontSize: 14, color: Colors.textPrimary }}
            placeholder="搜索租客姓名或电话..."
            placeholderTextColor={Colors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {/* 统计卡片 */}
      <View style={{ paddingHorizontal: 20, marginTop: -16 }}>
        <View style={{
          backgroundColor: 'white',
          borderRadius: 24,
          padding: 16,
          flexDirection: 'row',
          justifyContent: 'space-around',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: Colors.primary }}>{stats.total}</Text>
            <Text style={{ fontSize: 12, color: Colors.textMuted }}>总客户</Text>
          </View>
          <View style={{ width: 1, backgroundColor: '#F3F4F6' }} />
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: Colors.success }}>{stats.active}</Text>
            <Text style={{ fontSize: 12, color: Colors.textMuted }}>在租</Text>
          </View>
          <View style={{ width: 1, backgroundColor: '#F3F4F6' }} />
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: Colors.warning }}>{stats.expiring}</Text>
            <Text style={{ fontSize: 12, color: Colors.textMuted }}>即将到期</Text>
          </View>
        </View>
      </View>

      {/* 筛选按钮 */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginTop: 16, justifyContent: 'center' }}>
        {filterButtons.map((btn) => (
          <TouchableOpacity
            key={btn.key}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 20,
              borderRadius: 20,
              backgroundColor: filter === btn.key ? Colors.primary : 'white',
              marginHorizontal: 4,
              borderWidth: filter === btn.key ? 0 : 1,
              borderColor: '#E5E7EB',
            }}
            onPress={() => setFilter(btn.key)}
          >
            <Text style={{
              fontSize: 12,
              fontWeight: '700',
              color: filter === btn.key ? 'white' : Colors.textMuted,
            }}>
              {btn.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 租客列表 */}
      <ScrollView
        style={{ flex: 1, marginTop: 16 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[Colors.primary]} />
        }
      >
        {filteredTenants && filteredTenants.length > 0 ? (
          filteredTenants.map((tenant: TenantWithLease) => {
            const statusConfig = getTenantStatus(tenant)
            return (
              <TouchableOpacity
                key={tenant.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: 24,
                  padding: 16,
                  marginBottom: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.03,
                  shadowRadius: 2,
                  elevation: 1,
                  borderWidth: 1,
                  borderColor: '#F3F4F6',
                }}
                onPress={() => router.push(`/customers/${tenant.id}`)}
              >
                {/* 头像 */}
                <View style={{
                  width: 48,
                  height: 48,
                  backgroundColor: tenant.gender === 'female' ? '#FCE7F3' : '#DBEAFE',
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 20 }}>
                    {tenant.gender === 'female' ? '👩' : '👨'}
                  </Text>
                </View>

                {/* 信息 */}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.textPrimary }}>
                    {tenant.name}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Text style={{ fontSize: 12, color: Colors.textMuted }}>
                      📱 {tenant.phone}
                    </Text>
                  </View>
                </View>

                {/* 状态 */}
                <View style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  backgroundColor: statusConfig.bgColor,
                  borderRadius: 12,
                }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: statusConfig.color }}>
                    {statusConfig.label}
                  </Text>
                </View>
              </TouchableOpacity>
            )
          })
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>👥</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.textMuted, marginBottom: 8 }}>
              暂无客户数据
            </Text>
            <Text style={{ fontSize: 14, color: Colors.textMuted }}>
              点击右下角按钮添加客户
            </Text>
          </View>
        )}
      </ScrollView>

      {/* 悬浮添加按钮 */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          right: 20,
          bottom: 100,
          width: 56,
          height: 56,
          backgroundColor: Colors.primary,
          borderRadius: 28,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 4,
        }}
        onPress={() => router.push('/customers/new')}
      >
        <Text style={{ fontSize: 28, color: 'white' }}>+</Text>
      </TouchableOpacity>
    </View>
  )
}
