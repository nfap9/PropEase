import { ScrollView, View, Text, TouchableOpacity, RefreshControl } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { billsApi, reportsApi, utilitiesApi } from '@/services/api'
import { Colors } from '@/constants'
import { useAuth } from '@/hooks'

// 快捷功能数据
const quickActions = [
  { icon: '🏢', label: '公寓', color: '#EFF6FF', iconColor: '#2563EB', route: '/properties' },
  { icon: '🚪', label: '房间', color: '#F3E8FF', iconColor: '#9333EA', route: '/properties/rooms' },
  { icon: '👥', label: '租客', color: '#ECFDF5', iconColor: '#059669', route: '/customers' },
  { icon: '📝', label: '租约', color: '#FFF7ED', iconColor: '#EA580C', route: '/customers/leases' },
]

const quickActions2 = [
  { icon: '📄', label: '账单', color: '#FEF2F2', iconColor: '#DC2626', route: '/bills' },
  { icon: '💧', label: '水电', color: '#ECFEFF', iconColor: '#0891B2', route: '/utilities' },
  { icon: '📊', label: '报表', color: '#EEF2FF', iconColor: '#4F46E5', route: '/settings/reports' },
  { icon: '⚙️', label: '设置', color: '#F3F4F6', iconColor: '#4B5563', route: '/(tabs)/profile' },
]

// 最近动态数据
const recentActivities = [
  { icon: '🏢', title: '新增公寓 - 阳光公寓A栋', time: '刚刚', color: '#EFF6FF', iconColor: '#2563EB' },
  { icon: '🔑', title: '房间 101 出租给张三', time: '10分钟前', color: '#ECFDF5', iconColor: '#059669' },
  { icon: '📄', title: '2月账单已生成', time: '1小时前', color: '#FFF7ED', iconColor: '#EA580C' },
]

export default function HomeScreen() {
  const { organization } = useAuth()
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() + 1

  const { data: overview, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: reportsApi.getOverview,
  })

  const { data: meterQueue = [] } = useQuery({
    queryKey: ['utilities', 'export', currentYear, currentMonth, 'home'],
    queryFn: () => utilitiesApi.exportRooms(currentYear, currentMonth, 7),
  })

  const { data: unpaidBills = [] } = useQuery({
    queryKey: ['bills', 'pending', 'home'],
    queryFn: () => billsApi.list({ status: 'pending' }),
  })

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* 顶部导航 */}
      <View
        style={{
          backgroundColor: 'white',
          paddingHorizontal: 20,
          paddingVertical: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: '#F3F4F6',
        }}
      >
        <TouchableOpacity>
          <Text style={{ fontSize: 20 }}>☰</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '900', color: Colors.textPrimary, letterSpacing: -0.5 }}>
          公寓管理
        </Text>
        <TouchableOpacity>
          <Text style={{ fontSize: 20, color: Colors.textMuted }}>🔍</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[Colors.primary]} />
        }
      >
        {/* 头部信息区 */}
        <View style={{ marginHorizontal: 0, marginBottom: 0 }}>
          <View
            style={{
              backgroundColor: Colors.primary,
              paddingTop: 32,
              paddingBottom: 64,
              paddingHorizontal: 24,
              borderBottomLeftRadius: 45,
              borderBottomRightRadius: 45,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 }}>
              <Text style={{ fontSize: 36, fontWeight: '900', color: 'white' }}>
                {overview?.total_apartments || 0}
              </Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginLeft: 8, fontWeight: '500' }}>
                个公寓
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  padding: 16,
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                }}
              >
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>
                  总房间
                </Text>
                <Text style={{ color: 'white', fontSize: 20, fontWeight: '900', marginTop: 4 }}>
                  {overview?.total_rooms || 0}
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  padding: 16,
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                }}
              >
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>
                  本月收入
                </Text>
                <Text style={{ color: 'white', fontSize: 20, fontWeight: '900', marginTop: 4 }}>
                  ¥{(overview?.monthly_revenue || 0) / 10000}w
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 统计卡片悬浮区 */}
        <View style={{ paddingHorizontal: 20, marginTop: -40 }}>
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 24,
              padding: 20,
              shadowColor: '#1E3A8A',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 4,
              borderWidth: 1,
              borderColor: '#F9FAFB',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <StatItem icon="🏢" label="公寓" value={overview?.total_apartments || 0} bgColor="#F3F4F6" iconColor="#4B5563" />
              <StatItem icon="🚪" label="空房" value={overview?.available_rooms || 0} bgColor="#EFF6FF" iconColor="#2563EB" />
              <StatItem icon="👤" label="已租" value={overview?.occupied_rooms || 0} bgColor="#ECFDF5" iconColor="#059669" />
              <StatItem icon="🔧" label="维修" value={overview?.total_rooms ? overview.total_rooms - overview.available_rooms - overview.occupied_rooms : 0} bgColor="#FFF7ED" iconColor="#EA580C" />
            </View>
          </View>
        </View>

        {/* 快捷功能 */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: Colors.textPrimary, letterSpacing: -0.5 }}>
              快捷功能
            </Text>
            <TouchableOpacity>
              <Text style={{ fontSize: 12, color: Colors.primary, fontWeight: '700' }}>更多</Text>
            </TouchableOpacity>
          </View>

          <View
            style={{
              backgroundColor: 'white',
              padding: 16,
              borderRadius: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.03,
              shadowRadius: 2,
              elevation: 1,
              borderWidth: 1,
              borderColor: '#F3F4F6',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={{ alignItems: 'center' }}
                  onPress={() => router.push(action.route as any)}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      backgroundColor: action.color,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>{action.icon}</Text>
                  </View>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: Colors.textMuted }}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View
            style={{
              backgroundColor: 'white',
              padding: 16,
              borderRadius: 24,
              marginTop: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.03,
              shadowRadius: 2,
              elevation: 1,
              borderWidth: 1,
              borderColor: '#F3F4F6',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              {quickActions2.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={{ alignItems: 'center' }}
                  onPress={() => router.push(action.route as any)}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      backgroundColor: action.color,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>{action.icon}</Text>
                  </View>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: Colors.textMuted }}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* 今日待办 */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: Colors.textPrimary, letterSpacing: -0.5 }}>
              今日待办
            </Text>
            <Text style={{ fontSize: 12, color: Colors.textMuted }}>
              {organization?.name || '当前组织'}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 24,
              padding: 18,
              borderWidth: 1,
              borderColor: '#F3F4F6',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.03,
              shadowRadius: 2,
              elevation: 1,
              gap: 12,
            }}
          >
            <TodoRow
              icon="💧"
              title="待抄表房间"
              value={`${meterQueue.length} 间`}
              accent={Colors.primary}
              onPress={() => router.push('/utilities' as any)}
            />
            <TodoRow
              icon="💰"
              title="待处理账单"
              value={`${unpaidBills.length} 笔`}
              accent={Colors.warning}
              onPress={() => router.push('/bills' as any)}
            />
          </View>
        </View>

        {/* 最近动态 */}
        <View style={{ paddingHorizontal: 20, marginTop: 24, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: Colors.textPrimary, letterSpacing: -0.5 }}>
              最近动态
            </Text>
            <TouchableOpacity>
              <Text style={{ fontSize: 12, color: Colors.primary, fontWeight: '700' }}>查看全部</Text>
            </TouchableOpacity>
          </View>

          <View style={{ gap: 12 }}>
            {recentActivities.map((activity, index) => (
              <TouchableOpacity
                key={index}
                style={{
                  backgroundColor: 'white',
                  padding: 16,
                  borderRadius: 24,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.03,
                  shadowRadius: 2,
                  elevation: 1,
                  borderWidth: 1,
                  borderColor: '#F3F4F6',
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    backgroundColor: activity.color,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{activity.icon}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary }}>
                    {activity.title}
                  </Text>
                  <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 2, fontWeight: '500' }}>
                    {activity.time}
                  </Text>
                </View>
                <Text style={{ color: '#D1D5DB' }}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

function TodoRow({
  icon,
  title,
  value,
  accent,
  onPress,
}: {
  icon: string
  title: string
  value: string
  accent: string
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 18,
        backgroundColor: '#F8FAFC',
      }}
      onPress={onPress}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            backgroundColor: `${accent}18`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 18 }}>{icon}</Text>
        </View>
        <View style={{ marginLeft: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.textPrimary }}>{title}</Text>
          <Text style={{ marginTop: 2, fontSize: 12, color: Colors.textMuted }}>点击直达处理</Text>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 16, fontWeight: '900', color: accent }}>{value}</Text>
        <Text style={{ marginTop: 2, fontSize: 11, color: Colors.textMuted }}>立即查看</Text>
      </View>
    </TouchableOpacity>
  )
}

// 统计项组件
function StatItem({
  icon,
  label,
  value,
  bgColor,
  iconColor,
}: {
  icon: string
  label: string
  value: number
  bgColor: string
  iconColor: string
}) {
  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{
          width: 40,
          height: 40,
          backgroundColor: bgColor,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
        }}
      >
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <Text style={{ fontSize: 10, fontWeight: '700', color: Colors.textMuted }}>{label}</Text>
      <Text style={{ fontSize: 12, fontWeight: '900', color: Colors.textPrimary }}>{value}</Text>
    </View>
  )
}
