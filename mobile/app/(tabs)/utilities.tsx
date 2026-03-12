import { View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { utilitiesApi } from '@/services/api'
import { Colors } from '@/constants'
import { useState } from 'react'

type FilterType = 'all' | 'pending' | 'entered'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UtilityData = any

export default function UtilitiesScreen() {
  const [searchText, setSearchText] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')

  const { data: utilities, isLoading, refetch } = useQuery({
    queryKey: ['utilities', filter],
    queryFn: () => utilitiesApi.list({
      apartment_id: filter === 'all' ? undefined : undefined
    }),
  })

  const filteredUtilities = utilities?.filter((utility: UtilityData) => {
    if (!searchText) return true
    const roomNumber = utility.room?.room_number || ''
    return roomNumber.includes(searchText)
  })

  const stats = {
    pending: utilities?.filter((u: UtilityData) => u.status === 'pending' || u.status === 'overdue').length || 0,
    entered: utilities?.filter((u: UtilityData) => u.status === 'entered').length || 0,
  }

  const filterButtons = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待录入' },
    { key: 'entered', label: '已录入' },
  ]

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* 顶部 */}
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
          水电管理
        </Text>

        <View style={{ flexDirection: 'row', gap: 8, overflow: 'hidden' }}>
          {filterButtons.map((btn) => (
            <TouchableOpacity
              key={btn.key}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                backgroundColor: filter === btn.key ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: filter === btn.key ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
              }}
              onPress={() => setFilter(btn.key as FilterType)}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: '700',
                color: filter === btn.key ? 'white' : 'rgba(255,255,255,0.7)',
              }}>
                {btn.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 统计概览 */}
      <View style={{ paddingHorizontal: 20, marginTop: 16, marginBottom: 16 }}>
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: 'white',
            borderRadius: 24,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.03,
            shadowRadius: 2,
            elevation: 1,
            borderWidth: 1,
            borderColor: '#F3F4F6',
          }}
        >
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: '900', color: Colors.textPrimary }}>
                {stats.pending}
              </Text>
              <Text style={{ fontSize: 10, color: Colors.textMuted, fontWeight: '500', marginTop: 4 }}>
                待录入
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: '900', color: Colors.success }}>
                {stats.entered}
              </Text>
              <Text style={{ fontSize: 10, color: Colors.textMuted, fontWeight: '500', marginTop: 4 }}>
                已录入
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[Colors.primary]} />
        }
      >
        {/* 水电卡片列表 */}
        {isLoading ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>💧</Text>
            <Text style={{ color: Colors.textMuted, fontWeight: '600' }}>加载中...</Text>
          </View>
        ) : filteredUtilities && filteredUtilities.length > 0 ? (
          filteredUtilities.map((utility: UtilityData) => {
            const statusConfig = getStatusConfig(utility)
            return (
              <View
                key={utility.id}
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
              >
                {/* 头部信息 */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        backgroundColor: statusConfig.bgColor,
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 20 }}>{statusConfig.icon}</Text>
                    </View>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.textPrimary }}>
                        {utility.room?.room_number}
                      </Text>
                      <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 2, fontWeight: '500' }}>
                        {utility.period_month}/{utility.period_year}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: statusConfig.statusColor,
                      borderRadius: 12,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '700', color: statusConfig.textColor }}>
                      {statusConfig.statusLabel}
                    </Text>
                  </View>
                </View>

                {/* 上下期读数 */}
                <View style={{ marginTop: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: Colors.textMuted }}>上期水表</Text>
                    <Text style={{ fontSize: 12, color: Colors.textPrimary, fontWeight: '700' }}>
                      {utility.water_previous}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <Text style={{ fontSize: 11, color: Colors.textMuted }}>上期电表</Text>
                    <Text style={{ fontSize: 12, color: Colors.textPrimary, fontWeight: '700' }}>
                      {utility.electricity_previous}
                    </Text>
                  </View>
                </View>

                {/* 本期读数输入 */}
                <View
                  style={{
                    marginTop: 12,
                    padding: 16,
                    backgroundColor: '#F8FAFC',
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: Colors.textMuted }}>本期水表</Text>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <TextInput
                        style={{
                          height: 40,
                          borderWidth: 0,
                          backgroundColor: 'transparent',
                          textAlign: 'right',
                          flex: 1,
                          marginRight: 8,
                        }}
                        placeholder="请输入"
                        keyboardType="numeric"
                        defaultValue={utility.currentWater || ''}
                      />
                      <Text style={{ fontSize: 12, color: Colors.textMuted }}>m³</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                    <Text style={{ fontSize: 12, color: Colors.textMuted }}>本期电表</Text>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <TextInput
                        style={{
                          height: 40,
                          borderWidth: 0,
                          backgroundColor: 'transparent',
                          textAlign: 'right',
                          flex: 1,
                          marginRight: 8,
                        }}
                        placeholder="请输入"
                        keyboardType="numeric"
                        defaultValue={utility.currentElectricity || ''}
                      />
                      <Text style={{ fontSize: 12, color: Colors.textMuted }}>kWh</Text>
                    </View>
                  </View>
                </View>

                {/* 底部 */}
                <View
                  style={{
                    marginTop: 16,
                    paddingTop: 16,
                    borderTopWidth: 1,
                    borderTopColor: '#F3F4F6',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View>
                    <Text style={{ fontSize: 14, color: Colors.textMuted, fontWeight: '500' }}>上次录入: {utility.reading_date || '-'}</Text>
                  </View>
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      backgroundColor: Colors.primary,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>录入</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          })
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>💧</Text>
            <Text style={{ color: Colors.textMuted, fontWeight: '600' }}>暂无水电数据</Text>
            <TouchableOpacity
              style={{
                marginTop: 16,
                paddingHorizontal: 24,
                paddingVertical: 12,
                backgroundColor: Colors.primary,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: 'white', fontWeight: '700' }}>添加记录</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* 悬浮按钮 */}
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
  )
}

// 状态配置
function getStatusConfig(utility: UtilityData) {
  if (utility.status === 'pending' || !utility.status) {
    return {
      status: 'pending',
      statusLabel: '待录入',
      bgColor: '#FFF7ED',
      icon: '✏️',
      textColor: Colors.warning,
      statusColor: '#FFF7ED',
    }
  } else if (utility.status === 'overdue') {
    return {
      status: 'overdue',
      statusLabel: '已逾期',
      bgColor: '#FEF2F2',
      icon: '⚠️',
      textColor: Colors.danger,
      statusColor: '#FEF2F2',
    }
  }
  return {
    status: 'entered',
    statusLabel: '已录入',
    bgColor: '#ECFDF5',
    icon: '✅',
    textColor: Colors.success,
    statusColor: '#ECFDF5',
  }
}
