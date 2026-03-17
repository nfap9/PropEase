import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { apartmentsApi } from '@/services/api'
import { Colors } from '@/constants'
import { useState } from 'react'

type TabType = 'rooms' | 'fees' | 'utilities'

export default function ApartmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<TabType>('rooms')

  const { data: apartment, isLoading, refetch } = useQuery({
    queryKey: ['apartment', id],
    queryFn: () => apartmentsApi.get(id),
    enabled: !!id,
  })

  const { data: rooms } = useQuery({
    queryKey: ['apartment-rooms', id],
    queryFn: () => apartmentsApi.getRooms(id),
    enabled: !!id && activeTab === 'rooms',
  })

  const tabs: { key: TabType; label: string }[] = [
    { key: 'rooms', label: '房间列表' },
    { key: 'fees', label: '费用配置' },
    { key: 'utilities', label: '水电配置' },
  ]

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* 顶部导航 */}
      <View
        style={{
          backgroundColor: Colors.primary,
          paddingTop: 24,
          paddingBottom: 24,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 40,
          borderBottomRightRadius: 40,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 20, color: 'white' }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '900', color: 'white', flex: 1, textAlign: 'center' }}>
            {apartment?.name || '公寓详情'}
          </Text>
          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 20, color: 'white' }}>✏️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[Colors.primary]} />
        }
      >
        {/* 公寓信息卡片 */}
        <View style={{ paddingHorizontal: 20, marginTop: -24 }}>
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 28,
              padding: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
              borderWidth: 1,
              borderColor: '#F3F4F6',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  backgroundColor: Colors.primary,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: Colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Text style={{ fontSize: 24, color: 'white' }}>🏢</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: Colors.textPrimary }}>
                  {apartment?.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Text style={{ fontSize: 11, color: Colors.textMuted }}>📍 {apartment?.address || '暂无地址'}</Text>
                </View>
              </View>
            </View>
            <Text style={{ fontSize: 14, color: Colors.textSecondary, lineHeight: 20 }}>
              {apartment?.description || '暂无描述'}
            </Text>
          </View>
        </View>

        {/* 统计卡片 */}
        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 28,
              padding: 16,
              borderWidth: 1,
              borderColor: '#F3F4F6',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <StatItem label="总房间" value={rooms?.length || 0} color={Colors.textPrimary} />
              <StatItem label="空房" value={rooms?.filter(r => r.status === 'available').length || 0} color={Colors.success} />
              <StatItem label="已租" value={rooms?.filter(r => r.status === 'occupied').length || 0} color={Colors.primary} />
              <StatItem label="维修" value={rooms?.filter(r => r.status === 'maintenance').length || 0} color={Colors.warning} />
              <StatItem label="入住率" value="70%" color={Colors.primary} />
            </View>
            <View style={{ marginTop: 12, height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
              <View style={{ height: '100%', width: '70%', backgroundColor: Colors.primary, borderRadius: 4 }} />
            </View>
          </View>
        </View>

        {/* Tab 切换 */}
        <View style={{ marginTop: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
          <View style={{ flexDirection: 'row', paddingHorizontal: 20 }}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={{
                  flex: 1,
                  paddingVertical: 16,
                  borderBottomWidth: 2,
                  borderBottomColor: activeTab === tab.key ? Colors.primary : 'transparent',
                }}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    fontSize: 14,
                    fontWeight: '700',
                    color: activeTab === tab.key ? Colors.primary : Colors.textMuted,
                  }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 房间列表 */}
        {activeTab === 'rooms' && (
          <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
            {rooms && rooms.length > 0 ? (
              rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onPress={() => router.push(`/rooms/${room.id}` as any)}
                />
              ))
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>🚪</Text>
                <Text style={{ color: Colors.textMuted, fontWeight: '600' }}>暂无房间数据</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'fees' && (
          <View style={{ paddingHorizontal: 20, marginTop: 16, alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>💰</Text>
            <Text style={{ color: Colors.textMuted, fontWeight: '600' }}>费用配置开发中...</Text>
          </View>
        )}

        {activeTab === 'utilities' && (
          <View style={{ paddingHorizontal: 20, marginTop: 16, alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>💧</Text>
            <Text style={{ color: Colors.textMuted, fontWeight: '600' }}>水电配置开发中...</Text>
          </View>
        )}
      </ScrollView>

      {/* 新增按钮 */}
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

// 统计项组件
function StatItem({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: '900', color }}>{value}</Text>
      <Text style={{ fontSize: 9, color: Colors.textMuted, fontWeight: '500', marginTop: 2 }}>{label}</Text>
    </View>
  )
}

// 房间卡片组件
function RoomCard({
  room,
  onPress,
}: {
  room: any
  onPress: () => void
}) {
  const statusConfig = {
    available: { label: '空房', bgColor: '#ECFDF5', textColor: Colors.success, icon: '🚪' },
    occupied: { label: '已租', bgColor: '#EFF6FF', textColor: Colors.primary, icon: '👤' },
    maintenance: { label: '维修中', bgColor: '#FFF7ED', textColor: Colors.warning, icon: '🔧' },
  }

  const status = statusConfig[room.status as keyof typeof statusConfig] || statusConfig.available

  return (
    <TouchableOpacity
      style={{
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
      onPress={onPress}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 48,
            height: 48,
            backgroundColor: status.bgColor,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 20 }}>{status.icon}</Text>
        </View>
        <View style={{ marginLeft: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.textPrimary }}>
            {room.room_number}
          </Text>
          <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 2, fontWeight: '500' }}>
            ¥{room.monthly_rent}/月
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
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
        <Text style={{ color: '#D1D5DB', fontSize: 16 }}>⋮</Text>
      </View>
    </TouchableOpacity>
  )
}
