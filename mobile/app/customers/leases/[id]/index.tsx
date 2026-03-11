import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { leasesApi } from '@/services/api'
import { Colors } from '@/constants'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeaseData = any

export default function LeaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()

  const { data: lease, isLoading, refetch } = useQuery({
    queryKey: ['lease', id],
    queryFn: () => leasesApi.get(id),
    enabled: !!id,
  })

  const formatDate = (date: string | undefined | null) => {
    if (!date) return '未知'
    return new Date(date).toLocaleDateString('zh-CN')
  }

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return '¥0'
    return `¥${amount.toLocaleString('zh-CN')}`
  }

  const getLeaseStatus = (leaseData: LeaseData) => {
    if (!leaseData) return { label: '未知', color: Colors.textMuted, bgColor: '#F3F4F6' }
    if (!leaseData.is_active) return { label: '已结束', color: Colors.textMuted, bgColor: '#F3F4F6' }

    if (leaseData.end_date) {
      const endDate = new Date(leaseData.end_date)
      const now = new Date()
      const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      if (daysUntilExpiry <= 0) {
        return { label: '已到期', color: Colors.danger, bgColor: '#FEF2F2' }
      } else if (daysUntilExpiry <= 14) {
        return { label: '即将到期', color: Colors.warning, bgColor: '#FFF7ED' }
      }
    }
    return { label: '在租', color: Colors.success, bgColor: '#ECFDF5' }
  }

  const statusConfig = getLeaseStatus(lease)

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
            租约详情
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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 16 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[Colors.primary]} />
        }
      >
        <View style={{ paddingHorizontal: 20 }}>
          {/* 租客信息卡片 */}
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 28,
              padding: 20,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
              borderWidth: 1,
              borderColor: '#F3F4F6',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  backgroundColor: Colors.primary,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 28, color: 'white', fontWeight: '900' }}>
                  {lease?.tenant?.name?.charAt(0) || '?'}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: Colors.textPrimary }}>
                  {lease?.tenant?.name || '未知租客'}
                </Text>
                <Text style={{ fontSize: 14, color: Colors.textMuted, marginTop: 4 }}>
                  📱 {lease?.tenant?.phone || '暂无电话'}
                </Text>
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
          </View>

          {/* 房间信息 */}
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 28,
              padding: 20,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
              borderWidth: 1,
              borderColor: '#F3F4F6',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 }}>
              🚪 房间信息
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: '#EFF6FF',
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 16 }}>🏠</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary }}>
                  {lease?.room?.room_number || '未知房间'}
                </Text>
                <Text style={{ fontSize: 12, color: Colors.textMuted }}>房间号</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: '#EFF6FF',
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 16 }}>📍</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary }}>
                  {lease?.room?.apartment_name || '未知公寓'}
                </Text>
                <Text style={{ fontSize: 12, color: Colors.textMuted }}>
                  公寓名称
                </Text>
              </View>
            </View>
          </View>

          {/* 租约信息 */}
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 28,
              padding: 20,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
              borderWidth: 1,
              borderColor: '#F3F4F6',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 }}>
              📝 租约信息
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <View>
                <Text style={{ fontSize: 12, color: Colors.textMuted }}>开始日期</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary }}>
                  {formatDate(lease?.start_date)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 12, color: Colors.textMuted }}>结束日期</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary }}>
                  {formatDate(lease?.end_date)}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <View>
                <Text style={{ fontSize: 12, color: Colors.textMuted }}>月租金</Text>
                <Text style={{ fontSize: 16, fontWeight: '900', color: Colors.primary }}>
                  {formatCurrency(lease?.monthly_rent)}/月
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 12, color: Colors.textMuted }}>押金</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary }}>
                  {formatCurrency(lease?.deposit_amount)}
                </Text>
              </View>
            </View>
          </View>

          {/* 账单入口 */}
          <TouchableOpacity
            style={{
              backgroundColor: 'white',
              borderRadius: 28,
              padding: 20,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
              borderWidth: 1,
              borderColor: '#F3F4F6',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
            onPress={() => router.push(`/bills?lease_id=${id}` as any)}
          >
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
              <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginLeft: 12 }}>
                查看账单
              </Text>
            </View>
            <Text style={{ fontSize: 16, color: Colors.textMuted }}>→</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}
