import { Alert, Linking, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { roomsApi } from '@/services/api'
import { Colors } from '@/constants'
import { useState } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RoomData = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeaseData = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BillData = any

export default function RoomDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<'info' | 'lease' | 'bills'>('info')

  const { data: room, isLoading, refetch } = useQuery({
    queryKey: ['room', id],
    queryFn: () => roomsApi.get(id),
    enabled: !!id,
  })

  const { data: leases } = useQuery({
    queryKey: ['room-leases', id],
    queryFn: () => roomsApi.getLeases(id),
    enabled: !!id,
  })

  const { data: bills } = useQuery({
    queryKey: ['room-bills', id],
    queryFn: () => roomsApi.getBills(id),
    enabled: !!id && activeTab === 'bills',
  })

  const getRoomStatusConfig = (roomData: RoomData) => {
    if (!roomData) return { label: '未知', color: Colors.textMuted, bgColor: '#F3F4F6' }
    switch (roomData.status) {
      case 'available':
        return { label: '空房', color: Colors.success, bgColor: '#ECFDF5' }
      case 'occupied':
        return { label: '已租', color: Colors.primary, bgColor: '#EFF6FF' }
      case 'maintenance':
        return { label: '维修中', color: Colors.warning, bgColor: '#FFF7ED' }
      default:
        return { label: '未知', color: Colors.textMuted, bgColor: '#F3F4F6' }
    }
  }

  const tabs = [
    { key: 'info', label: '基本信息', icon: '📋️' },
    { key: 'lease', label: '租约信息', icon: '📝' },
    { key: 'bills', label: '账单记录', icon: '💰' },
  ]

  const statusConfig = getRoomStatusConfig(room)

  const handleDial = async (phone?: string | null, fallbackMessage = '暂无联系电话') => {
    if (!phone) {
      Alert.alert('无法拨打', fallbackMessage)
      return
    }

    const telUrl = `tel:${phone}`
    const canOpen = await Linking.canOpenURL(telUrl)
    if (!canOpen) {
      Alert.alert('无法拨打', '当前设备不支持拨打电话')
      return
    }

    await Linking.openURL(telUrl)
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* 顶部导航 */}
      <View
        style={{
          backgroundColor: Colors.primary,
          paddingTop: 48,
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
              justifyContent: 'center'
            }}
          >
            <Text style={{ fontSize: 20, color: 'white' }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '900', color: 'white', flex: 1, textAlign: 'center' }}>
            {room?.room_number || '房间详情'}
          </Text>
          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Text style={{ fontSize: 20, color: 'white' }}>✏️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 房间信息卡片 */}
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
              }}
            >
              <Text style={{ fontSize: 24, color: 'white' }}>🚪</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: Colors.textPrimary }}>
                {room?.room_number}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Text style={{ fontSize: 11, color: Colors.textMuted }}>
                  📍 {room?.apartment?.address || '暂无地址'}
                </Text>
              </View>
            </View>
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: statusConfig.bgColor,
                borderRadius: 12,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: statusConfig.color }}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          {/* 租金信息 */}
          <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontSize: 12, color: Colors.textMuted }}>月租金</Text>
                <Text style={{ fontSize: 20, fontWeight: '900', color: Colors.primary }}>
                  ¥{room?.monthly_rent || 0}/月
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Tab 切换 */}
      <View style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', marginTop: 16 }}>
        <View style={{ flexDirection: 'row', paddingHorizontal: 20 }}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={{
                flex: 1,
                paddingVertical: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottomWidth: 2,
                borderBottomColor: activeTab === tab.key ? Colors.primary : 'transparent',
              }}
              onPress={() => setActiveTab(tab.key as 'info' | 'lease' | 'bills')}
            >
              <Text style={{ fontSize: 16, marginRight: 8 }}>{tab.icon}</Text>
              <Text
                style={{
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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[Colors.primary]} />
        }
      >
        {activeTab === 'info' && (
          <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
            {/* 基本信息 */}
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor: '#EFF6FF',
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 14 }}>🏢</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary }}>
                    {room?.apartment?.name || '未知公寓'}
                  </Text>
                  <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>
                    公寓名称
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor: '#EFF6FF',
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 14 }}>📍</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary }}>
                    {room?.apartment?.address || '暂无地址'}
                  </Text>
                  <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>
                    公寓地址
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor: '#EFF6FF',
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 14 }}>📊</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary }}>
                    {room?.area ? `${room.area} m²` : room?.layout || '未知'}
                  </Text>
                  <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>
                    房间信息
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor: '#EFF6FF',
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 14 }}>💰</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary }}>
                    ¥{room?.monthly_rent || 0}/月
                  </Text>
                  <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>
                    月租金
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor: '#EFF6FF',
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 14 }}>📋</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary }}>
                    {statusConfig.label}
                  </Text>
                  <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>
                    房间状态
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'lease' && (
          <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
            {leases && leases.length > 0 ? (
              leases.map((lease: LeaseData) => (
                <TouchableOpacity
                  key={lease.id}
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
                  onPress={() => router.push(`/customers/leases/${lease.id}` as any)}
                >
                  {/* 租客信息 */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        backgroundColor: '#ECFDF5',
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 16 }}>👤</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.textPrimary }}>
                        {lease.tenant?.name || '未知租客'}
                      </Text>
                      <Text style={{ fontSize: 12, color: Colors.textMuted }}>
                        📱 {lease.tenant?.phone || '暂无电话'}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 2 }}>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 14,
                        alignItems: 'center',
                        backgroundColor: '#EFF6FF',
                      }}
                      onPress={() => handleDial(lease.tenant?.phone, '租客未填写手机号')}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.primary }}>
                        拨打租客
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 14,
                        alignItems: 'center',
                        backgroundColor: '#F8FAFC',
                      }}
                      onPress={() =>
                        handleDial(
                          lease.tenant?.emergency_phone,
                          '租客未填写紧急联系人电话'
                        )
                      }
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.textSecondary }}>
                        紧急联系
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* 租期信息 */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                    <View>
                      <Text style={{ fontSize: 12, color: Colors.textMuted }}>租期</Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary }}>
                        {lease.start_date ? new Date(lease.start_date).toLocaleDateString() : '未知'}
                      </Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 12, color: Colors.textMuted }}>至</Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary }}>
                        {lease.end_date ? new Date(lease.end_date).toLocaleDateString() : '未知'}
                      </Text>
                    </View>
                  </View>

                  {/* 租金 */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                    <View>
                      <Text style={{ fontSize: 12, color: Colors.textMuted }}>月租金</Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.primary }}>
                        ¥{lease.monthly_rent || 0}/月
                      </Text>
                    </View>
                    <View
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        backgroundColor: lease.is_active ? '#ECFDF5' : '#F3F4F6',
                        borderRadius: 12,
                        alignSelf: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '700', color: lease.is_active ? Colors.success : Colors.textMuted }}>
                        {lease.is_active ? '在租' : '已结束'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>📝</Text>
                <Text style={{ color: Colors.textMuted, fontWeight: '600' }}>暂无租约记录</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'bills' && (
          <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
            {bills && bills.length > 0 ? (
              bills.map((bill: BillData) => (
                <TouchableOpacity
                  key={bill.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: 24,
                    padding: 16,
                    marginBottom: 12,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.03,
                    shadowRadius: 2,
                    elevation: 1,
                    borderWidth: 1,
                    borderColor: '#F3F4F6',
                  }}
                  onPress={() => router.push(`/bills/${bill.id}` as any)}
                >
                  {/* 账单信息 */}
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        backgroundColor: '#FEF2F2',
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 16 }}>💰</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.textPrimary }}>
                        ¥{bill.total_amount}
                      </Text>
                      <Text style={{ fontSize: 12, color: Colors.textMuted }}>
                        账单月份: {bill.bill_year}年{bill.bill_month}月
                      </Text>
                    </View>
                  </View>

                  {/* 账单状态 */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, alignItems: 'center' }}>
                    <View
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        backgroundColor:
                          bill.status === 'paid'
                            ? '#ECFDF5'
                            : bill.status === 'pending'
                            ? '#FFF7ED'
                            : '#FEF2F2',
                        borderRadius: 12,
                      }}
                    >
                      <Text style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color:
                          bill.status === 'paid'
                            ? Colors.success
                            : bill.status === 'pending'
                            ? Colors.warning
                            : Colors.danger
                      }}>
                        {bill.status === 'paid' ? '已支付' : bill.status === 'pending' ? '待支付' : '已逾期'}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: Colors.textPrimary }}>
                      ¥{bill.total_amount}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>💰</Text>
                <Text style={{ color: Colors.textMuted, fontWeight: '600' }}>暂无账单记录</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  )
}
