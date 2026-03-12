import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { reportsApi } from '@/services/api'
import { Colors } from '@/constants'
import { useState } from 'react'

const screenWidth = Dimensions.get('window').width

type TimeFilter = 'month' | 'quarter' | 'year'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OverviewData = any

export default function ReportsScreen() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month')

  const { data: overview, isLoading, refetch } = useQuery<OverviewData>({
    queryKey: ['reports-overview', timeFilter],
    queryFn: reportsApi.getOverview,
  })

  const filterButtons: { key: TimeFilter; label: string }[] = [
    { key: 'month', label: '本月' },
    { key: 'quarter', label: '本季度' },
    { key: 'year', label: '本年' },
  ]

  // Mock data for charts
  const chartData = {
    months: ['1月', '2月', '3月'],
    income: [12000, 15000, 19200],
    expense: [3000, 2800, 3200],
  }

  // 从 overview 获取入住率
  const occupancyRate = overview?.occupancy_rate ? Math.round(overview.occupancy_rate * 100) : 75

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
          经营报表
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {filterButtons.map((btn) => (
            <TouchableOpacity
              key={btn.key}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                backgroundColor: timeFilter === btn.key ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                borderRadius: 20,
                borderWidth: 1,
                borderColor: timeFilter === btn.key ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
              }}
              onPress={() => setTimeFilter(btn.key)}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: '700',
                color: timeFilter === btn.key ? 'white' : 'rgba(255,255,255,0.7)',
              }}>
                {btn.label}
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
        {/* 收入概览 */}
        <View style={{ paddingHorizontal: 20, marginTop: -24 }}>
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textMuted }}>本月收入</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.primary }}>详细</Text>
            </View>
            <Text style={{ fontSize: 36, fontWeight: '900', color: Colors.textPrimary, marginBottom: 16 }}>
              ¥ {(overview?.monthly_revenue || 0).toLocaleString()}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: Colors.success, fontWeight: '700' }}>↑ +12.5%</Text>
              <Text style={{ fontSize: 12, color: Colors.textMuted, marginLeft: 4 }}>较上月</Text>
            </View>
          </View>
        </View>

        {/* 收支趋势图表 */}
        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 24,
              padding: 16,
              borderWidth: 1,
              borderColor: '#F3F4F6',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary }}>收支趋势</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 12, height: 12, backgroundColor: Colors.primary, borderRadius: 6 }} />
                <Text style={{ fontSize: 10, color: Colors.textMuted, marginLeft: 4 }}>收入</Text>
                <View style={{ width: 12, height: 12, backgroundColor: '#F87171', borderRadius: 6, marginLeft: 12 }} />
                <Text style={{ fontSize: 10, color: Colors.textMuted, marginLeft: 4 }}>支出</Text>
              </View>
            </View>

            {/* 简易柱状图 */}
            <View style={{ height: 160, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingHorizontal: 20 }}>
              {chartData.months.map((month, index) => (
                <View key={month} style={{ alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
                    <View
                      style={{
                        width: 24,
                        height: (chartData.income[index] / 20000) * 100,
                        backgroundColor: Colors.primary,
                        borderRadius: 6,
                      }}
                    />
                    <View
                      style={{
                        width: 24,
                        height: (chartData.expense[index] / 20000) * 100,
                        backgroundColor: '#F87171',
                        borderRadius: 6,
                      }}
                    />
                  </View>
                  <Text style={{ fontSize: 10, color: Colors.textMuted, marginTop: 8 }}>{month}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 统计卡片 */}
        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: 'white',
                borderRadius: 20,
                padding: 16,
                borderWidth: 1,
                borderColor: '#F3F4F6',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor: '#ECFDF5',
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 14 }}>↑</Text>
                </View>
                <Text style={{ fontSize: 10, color: Colors.textMuted, marginLeft: 8 }}>收入</Text>
              </View>
              <Text style={{ fontSize: 20, fontWeight: '900', color: Colors.textPrimary }}>
                ¥{((overview?.monthly_revenue || 0) / 10000).toFixed(1)}w
              </Text>
              <Text style={{ fontSize: 10, color: Colors.success, marginTop: 4 }}>+15.2%</Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: 'white',
                borderRadius: 20,
                padding: 16,
                borderWidth: 1,
                borderColor: '#F3F4F6',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor: '#FEF2F2',
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 14 }}>↓</Text>
                </View>
                <Text style={{ fontSize: 10, color: Colors.textMuted, marginLeft: 8 }}>支出</Text>
              </View>
              <Text style={{ fontSize: 20, fontWeight: '900', color: Colors.textPrimary }}>
                ¥3.2w
              </Text>
              <Text style={{ fontSize: 10, color: Colors.danger, marginTop: 4 }}>+8.5%</Text>
            </View>
          </View>
        </View>

        {/* 房源统计 */}
        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: '#F3F4F6',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 }}>
              房源统计
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: Colors.textPrimary }}>
                  {overview?.total_apartments || 0}
                </Text>
                <Text style={{ fontSize: 9, color: Colors.textMuted }}>公寓</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: Colors.textPrimary }}>
                  {overview?.total_rooms || 0}
                </Text>
                <Text style={{ fontSize: 9, color: Colors.textMuted }}>房间</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: Colors.success }}>
                  {overview?.occupied_rooms || 0}
                </Text>
                <Text style={{ fontSize: 9, color: Colors.textMuted }}>入住</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: Colors.warning }}>
                  {overview?.available_rooms || 0}
                </Text>
                <Text style={{ fontSize: 9, color: Colors.textMuted }}>空置</Text>
              </View>
            </View>

            {/* 入住率进度条 */}
            <View style={{ marginTop: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 10, color: Colors.textMuted }}>入住率</Text>
                <Text style={{ fontSize: 10, fontWeight: '700', color: Colors.primary }}>{occupancyRate}%</Text>
              </View>
              <View style={{ height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                <View
                  style={{
                    height: '100%',
                    width: `${occupancyRate}%`,
                    backgroundColor: Colors.primary,
                    borderRadius: 4,
                  }}
                />
              </View>
            </View>
          </View>
        </View>

        {/* 租客统计 */}
        <View style={{ paddingHorizontal: 20, marginTop: 16, marginBottom: 24 }}>
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: '#F3F4F6',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 }}>
              租客统计
            </Text>
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, color: Colors.primary }}>👤</Text>
                  <Text style={{ fontSize: 14, color: Colors.textSecondary, marginLeft: 8 }}>在租租客</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary }}>142 人</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, color: Colors.warning }}>⚠️</Text>
                  <Text style={{ fontSize: 14, color: Colors.textSecondary, marginLeft: 8 }}>即将到期</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.warning }}>14 人</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, color: Colors.danger }}>❌</Text>
                  <Text style={{ fontSize: 14, color: Colors.textSecondary, marginLeft: 8 }}>已逾期</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.danger }}>3 人</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
