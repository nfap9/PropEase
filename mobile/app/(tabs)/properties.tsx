import { View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { apartmentsApi, type ApartmentWithStats } from '@/services/api'
import { Colors } from '@/constants'
import { useState } from 'react'

export default function PropertiesScreen() {
  const [searchText, setSearchText] = useState('')

  const { data: apartments, isLoading, refetch } = useQuery({
    queryKey: ['apartments'],
    queryFn: apartmentsApi.list,
  })

  const filteredApartments = apartments?.filter((apt: ApartmentWithStats) =>
    apt.name.toLowerCase().includes(searchText.toLowerCase()) ||
    apt.address?.toLowerCase().includes(searchText.toLowerCase())
  )

  // 统计总数
  const stats = apartments?.reduce(
    (acc, apt) => ({
      total: acc.total + 1,
      rooms: acc.rooms + (apt.room_count || 0),
      available: acc.available + (apt.available_rooms || 0),
      occupied: acc.occupied + (apt.occupied_rooms || 0),
      maintenance: acc.maintenance + (apt.maintenance_rooms || 0),
    }),
    { total: 0, rooms: 0, available: 0, occupied: 0, maintenance: 0 }
  ) || { total: 0, rooms: 0, available: 0, occupied: 0, maintenance: 0 }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* 顶部搜索区 */}
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
          房源管理
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
            paddingHorizontal: 16,
          }}
        >
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={{
            flex: 1,
            paddingVertical: 12,
            fontSize: 14,
            color: 'white',
            backgroundColor: 'transparent',
          }}
            placeholder="搜索公寓名称或地址"
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {/* 统计概览 */}
      <View style={{ paddingHorizontal: 20, marginTop: -24 }}>
        <View
          style={{
            backgroundColor: 'white',
            borderRadius: 28,
            padding: 16,
            shadowColor: '#1E3A8A',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <StatItem label="公寓" value={stats.total} color={Colors.textPrimary} />
            <StatItem label="总房间" value={stats.rooms} color="#6B7280" />
            <StatItem label="空房" value={stats.available} color={Colors.success} />
            <StatItem label="已租" value={stats.occupied} color={Colors.primary} />
            <StatItem label="维修" value={stats.maintenance} color={Colors.warning} />
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[Colors.primary]} />
        }
      >
        {filteredApartments && filteredApartments.length > 0 ? (
          filteredApartments.map((apartment, index) => (
            <ApartmentCard
              key={apartment.id}
              apartment={apartment}
              colorIndex={index}
              onPress={() => router.push(`/properties/${apartment.id}`)}
            />
          ))
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🏢</Text>
            <Text style={{ color: Colors.textMuted, fontWeight: '600' }}>暂无公寓数据</Text>
            <TouchableOpacity
              style={{
                marginTop: 16,
                paddingHorizontal: 24,
                paddingVertical: 12,
                backgroundColor: Colors.primary,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: 'white', fontWeight: '700' }}>添加公寓</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* 悬浮按钮 */}
      <View
        style={{
          position: 'absolute',
          right: 20,
          bottom: 100,
          alignItems: 'center',
          gap: 12,
        }}
      >
        <TouchableOpacity
          style={{
            width: 56,
            height: 56,
            backgroundColor: 'white',
            borderRadius: 28,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
            borderWidth: 1,
            borderColor: '#F3F4F6',
          }}
          onPress={() => router.push('/properties/rooms')}
        >
          <Text style={{ fontSize: 20 }}>🚪</Text>
        </TouchableOpacity>
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
function StatItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: '900', color }}>{value}</Text>
      <Text style={{ fontSize: 10, color: Colors.textMuted, fontWeight: '500', marginTop: 2 }}>{label}</Text>
    </View>
  )
}

// 公寓卡片组件
function ApartmentCard({
  apartment,
  colorIndex,
  onPress,
}: {
  apartment: ApartmentWithStats
  colorIndex: number
  onPress: () => void
}) {
  const colors = ['#2563EB', '#9333EA', '#059669', '#EA580C', '#0891B2']
  const bgColor = colors[colorIndex % colors.length]

  const occupancyRate = apartment.room_count > 0
    ? Math.round((apartment.occupied_rooms / apartment.room_count) * 100)
    : 0

  return (
    <TouchableOpacity
      style={{
        backgroundColor: 'white',
        borderRadius: 28,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#F3F4F6',
      }}
      onPress={onPress}
      activeOpacity={0.98}
    >
      {/* 头部信息 */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 48,
              height: 48,
              backgroundColor: bgColor,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 20, color: 'white' }}>🏢</Text>
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.textPrimary }}>
              {apartment.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <Text style={{ fontSize: 11, color: Colors.textMuted }}>📍 {apartment.address || '暂无地址'}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#D1D5DB', fontSize: 16 }}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* 房间统计 */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <View style={{ flex: 1, backgroundColor: '#F8FAFC', borderRadius: 16, padding: 12, alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '900', color: '#374151' }}>{apartment.room_count || 0}</Text>
          <Text style={{ fontSize: 9, color: Colors.textMuted, fontWeight: '500' }}>总房间</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#ECFDF5', borderRadius: 16, padding: 12, alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '900', color: Colors.success }}>{apartment.available_rooms || 0}</Text>
          <Text style={{ fontSize: 9, color: Colors.textMuted, fontWeight: '500' }}>空房</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#EFF6FF', borderRadius: 16, padding: 12, alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '900', color: Colors.primary }}>{apartment.occupied_rooms || 0}</Text>
          <Text style={{ fontSize: 9, color: Colors.textMuted, fontWeight: '500' }}>已租</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#FFF7ED', borderRadius: 16, padding: 12, alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '900', color: Colors.warning }}>{apartment.maintenance_rooms || 0}</Text>
          <Text style={{ fontSize: 9, color: Colors.textMuted, fontWeight: '500' }}>维修</Text>
        </View>
      </View>

      {/* 入住率进度条 */}
      <View style={{ backgroundColor: '#F8FAFC', borderRadius: 16, padding: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: Colors.textMuted }}>入住率</Text>
          <Text style={{ fontSize: 12, fontWeight: '900', color: occupancyRate >= 70 ? Colors.primary : Colors.success }}>
            {occupancyRate}%
          </Text>
        </View>
        <View style={{ height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
          <View
            style={{
              height: '100%',
              width: `${occupancyRate}%`,
              backgroundColor: occupancyRate >= 70 ? Colors.primary : Colors.success,
              borderRadius: 4,
            }}
          />
        </View>
      </View>
    </TouchableOpacity>
  )
}
