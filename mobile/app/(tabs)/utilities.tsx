import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { utilitiesApi, leasesApi, apartmentsApi, type UtilityExportRoom, type UtilityWithDetails } from '@/services/api'
import { Colors } from '@/constants'

type FilterType = 'all' | 'pending' | 'entered'
type QueueStatus = 'pending' | 'upcoming' | 'overdue' | 'entered'

type ActiveLease = {
  room_id: string
  billing_day?: number
  water_rate?: number
  electricity_rate?: number
  tenant?: {
    name?: string | null
    phone?: string | null
  }
}

type QueueItem = {
  roomId: string
  readingId?: string
  apartmentId?: string
  apartmentName: string
  roomNumber: string
  tenantName: string
  tenantPhone: string
  billingDay: number
  status: QueueStatus
  waterPrevious: number | null
  electricityPrevious: number | null
  waterReading: number | null
  electricityReading: number | null
  waterUnitPrice: number | null
  electricityUnitPrice: number | null
  notes: string
  readingDate?: string
}

const statusOrder: Record<QueueStatus, number> = {
  overdue: 0,
  upcoming: 1,
  pending: 2,
  entered: 3,
}

function getBillingStatus(billingDay: number): QueueStatus {
  const today = new Date()
  const currentDay = today.getDate()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const adjustedBillingDay = Math.min(Math.max(billingDay, 1), daysInMonth)

  if (currentDay > adjustedBillingDay) {
    return 'overdue'
  }

  if (currentDay >= adjustedBillingDay - 3) {
    return 'upcoming'
  }

  return 'pending'
}

function getStatusMeta(status: QueueStatus) {
  switch (status) {
    case 'overdue':
      return {
        label: '已逾期',
        textColor: Colors.danger,
        bgColor: '#FEF2F2',
        icon: '🔴',
      }
    case 'upcoming':
      return {
        label: '即将抄表',
        textColor: Colors.warning,
        bgColor: '#FFF7ED',
        icon: '🟠',
      }
    case 'entered':
      return {
        label: '已录入',
        textColor: Colors.success,
        bgColor: '#ECFDF5',
        icon: '✅',
      }
    default:
      return {
        label: '待抄表',
        textColor: Colors.primary,
        bgColor: '#EFF6FF',
        icon: '🔵',
      }
  }
}

function parseDecimal(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function sanitizeNumericInput(value: string): string {
  return value.replace(/[^0-9.]/g, '')
}

function formatMoney(value: number | null): string {
  if (value == null || Number.isNaN(value)) return '--'
  return value.toFixed(2)
}

function formatReading(value: number | null): string {
  if (value == null || Number.isNaN(value)) return '--'
  return value.toFixed(2)
}

function compareRoomNumber(a: string, b: string) {
  return a.localeCompare(b, 'zh-Hans-CN', { numeric: true, sensitivity: 'base' })
}

export default function UtilitiesScreen() {
  const queryClient = useQueryClient()
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() + 1
  const readingDate = today.toISOString().slice(0, 10)

  const [searchText, setSearchText] = useState('')
  const [filter, setFilter] = useState<FilterType>('pending')
  const [selectedApartmentId, setSelectedApartmentId] = useState<string>('all')
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [waterInput, setWaterInput] = useState('')
  const [electricityInput, setElectricityInput] = useState('')
  const [notes, setNotes] = useState('')

  const { data: apartments = [] } = useQuery({
    queryKey: ['apartments'],
    queryFn: apartmentsApi.list,
  })

  const {
    data: exportRooms = [],
    isLoading: exportLoading,
    refetch: refetchExport,
  } = useQuery({
    queryKey: ['utilities', 'export', currentYear, currentMonth],
    queryFn: () => utilitiesApi.exportRooms(currentYear, currentMonth, 7),
  })

  const {
    data: readings = [],
    isLoading: readingsLoading,
    refetch: refetchReadings,
  } = useQuery({
    queryKey: ['utilities', currentYear, currentMonth],
    queryFn: () =>
      utilitiesApi.list({
        period_year: currentYear,
        period_month: currentMonth,
      }),
  })

  const { data: activeLeases = [] } = useQuery<ActiveLease[]>({
    queryKey: ['leases', 'active'],
    queryFn: () => leasesApi.list({ is_active: true }),
  })

  const leaseByRoomId: Record<string, ActiveLease> = {}
  activeLeases.forEach((lease) => {
    if (lease?.room_id) {
      leaseByRoomId[lease.room_id] = lease
    }
  })

  const exportByRoomId: Record<string, UtilityExportRoom> = {}
  exportRooms.forEach((room) => {
    exportByRoomId[room.room_id] = room
  })

  const queueItems: QueueItem[] = exportRooms.map((room) => ({
    roomId: room.room_id,
    apartmentId: room.apartment_id,
    apartmentName: room.apartment_name,
    roomNumber: room.room_number,
    tenantName: room.tenant_name,
    tenantPhone: room.tenant_phone,
    billingDay: room.billing_day,
    status: getBillingStatus(room.billing_day),
    waterPrevious: room.water_previous,
    electricityPrevious: room.electricity_previous,
    waterReading: null,
    electricityReading: null,
    waterUnitPrice: room.water_unit_price,
    electricityUnitPrice: room.electricity_unit_price,
    notes: '',
  }))

  const queuedRoomIds = new Set(queueItems.map((item) => item.roomId))

  readings.forEach((reading: UtilityWithDetails) => {
    if (queuedRoomIds.has(reading.room_id)) {
      return
    }

    const lease = leaseByRoomId[reading.room_id]
    const exportRoom = exportByRoomId[reading.room_id]
    const waterRate =
      exportRoom?.water_unit_price ??
      (lease?.water_rate != null && Number(lease.water_rate) > 0 ? Number(lease.water_rate) : null)
    const electricityRate =
      exportRoom?.electricity_unit_price ??
      (lease?.electricity_rate != null && Number(lease.electricity_rate) > 0
        ? Number(lease.electricity_rate)
        : null)

    queueItems.push({
      roomId: reading.room_id,
      readingId: reading.id,
      apartmentId: exportRoom?.apartment_id ?? reading.room?.apartment?.id,
      apartmentName: exportRoom?.apartment_name ?? reading.room?.apartment?.name ?? '未知公寓',
      roomNumber: exportRoom?.room_number ?? reading.room?.room_number ?? '未知房间',
      tenantName: exportRoom?.tenant_name ?? lease?.tenant?.name ?? '未绑定租客',
      tenantPhone: exportRoom?.tenant_phone ?? lease?.tenant?.phone ?? '',
      billingDay: exportRoom?.billing_day ?? lease?.billing_day ?? 1,
      status: 'entered',
      waterPrevious: reading.water_previous != null ? Number(reading.water_previous) : null,
      electricityPrevious:
        reading.electricity_previous != null ? Number(reading.electricity_previous) : null,
      waterReading: reading.water_reading != null ? Number(reading.water_reading) : null,
      electricityReading:
        reading.electricity_reading != null ? Number(reading.electricity_reading) : null,
      waterUnitPrice: waterRate,
      electricityUnitPrice: electricityRate,
      notes: reading.notes ?? '',
      readingDate: reading.reading_date,
    })
  })

  queueItems.sort((left, right) => {
    if (statusOrder[left.status] !== statusOrder[right.status]) {
      return statusOrder[left.status] - statusOrder[right.status]
    }

    if (left.billingDay !== right.billingDay) {
      return left.billingDay - right.billingDay
    }

    return compareRoomNumber(left.roomNumber, right.roomNumber)
  })

  const filteredItems = queueItems.filter((item) => {
    if (selectedApartmentId !== 'all' && item.apartmentId !== selectedApartmentId) {
      return false
    }

    if (filter === 'pending' && item.status === 'entered') {
      return false
    }

    if (filter === 'entered' && item.status !== 'entered') {
      return false
    }

    if (!searchText.trim()) {
      return true
    }

    const keyword = searchText.trim().toLowerCase()
    return (
      item.apartmentName.toLowerCase().includes(keyword) ||
      item.roomNumber.toLowerCase().includes(keyword) ||
      item.tenantName.toLowerCase().includes(keyword)
    )
  })

  useEffect(() => {
    if (filteredItems.length === 0) {
      setActiveRoomId(null)
      return
    }

    const hasActiveRoom = filteredItems.some((item) => item.roomId === activeRoomId)
    if (hasActiveRoom) {
      return
    }

    const preferredItem =
      filteredItems.find((item) => item.status !== 'entered') ?? filteredItems[0]
    setActiveRoomId(preferredItem.roomId)
  }, [activeRoomId, filteredItems])

  const activeItem =
    filteredItems.find((item) => item.roomId === activeRoomId) ??
    queueItems.find((item) => item.roomId === activeRoomId) ??
    null

  useEffect(() => {
    if (!activeItem) {
      setWaterInput('')
      setElectricityInput('')
      setNotes('')
      return
    }

    setWaterInput(activeItem.waterReading != null ? String(activeItem.waterReading) : '')
    setElectricityInput(
      activeItem.electricityReading != null ? String(activeItem.electricityReading) : ''
    )
    setNotes(activeItem.notes ?? '')
  }, [activeItem?.roomId, activeItem?.readingId])

  const saveMutation = useMutation({
    mutationFn: async (item: QueueItem) => {
      const waterReading = parseDecimal(waterInput)
      const electricityReading = parseDecimal(electricityInput)

      if (waterReading == null && electricityReading == null) {
        throw new Error('请至少录入一个读数')
      }

      if (item.waterPrevious != null && waterReading != null && waterReading < item.waterPrevious) {
        throw new Error('水表读数不能小于上次读数')
      }

      if (
        item.electricityPrevious != null &&
        electricityReading != null &&
        electricityReading < item.electricityPrevious
      ) {
        throw new Error('电表读数不能小于上次读数')
      }

      const payload = {
        room_id: item.roomId,
        period_year: currentYear,
        period_month: currentMonth,
        reading_date: readingDate,
        water_previous: item.waterPrevious ?? undefined,
        electricity_previous: item.electricityPrevious ?? undefined,
        water_reading: waterReading ?? undefined,
        electricity_reading: electricityReading ?? undefined,
        notes: notes.trim() || undefined,
      }

      if (item.readingId) {
        return utilitiesApi.update(item.readingId, payload)
      }

      return utilitiesApi.create(payload)
    },
  })

  const handleRefresh = async () => {
    await Promise.all([refetchExport(), refetchReadings()])
  }

  const pendingCount = queueItems.filter((item) => item.status !== 'entered').length
  const enteredCount = queueItems.filter((item) => item.status === 'entered').length
  const overdueCount = queueItems.filter((item) => item.status === 'overdue').length
  const isLoading = exportLoading || readingsLoading

  const waterReading = parseDecimal(waterInput)
  const electricityReading = parseDecimal(electricityInput)

  const waterUsage =
    activeItem?.waterPrevious != null && waterReading != null
      ? Math.max(0, waterReading - activeItem.waterPrevious)
      : null
  const electricityUsage =
    activeItem?.electricityPrevious != null && electricityReading != null
      ? Math.max(0, electricityReading - activeItem.electricityPrevious)
      : null

  const waterFee =
    waterUsage != null && activeItem?.waterUnitPrice != null
      ? waterUsage * activeItem.waterUnitPrice
      : null
  const electricityFee =
    electricityUsage != null && activeItem?.electricityUnitPrice != null
      ? electricityUsage * activeItem.electricityUnitPrice
      : null

  const getNextPendingRoomId = (roomId: string) => {
    const visiblePendingItems = filteredItems.filter((item) => item.status !== 'entered')
    const currentIndex = visiblePendingItems.findIndex((item) => item.roomId === roomId)
    if (currentIndex === -1) return null
    return visiblePendingItems[currentIndex + 1]?.roomId ?? null
  }

  const handleOpenRoom = (roomId: string) => {
    router.push(`/rooms/${roomId}` as any)
  }

  const handleCallTenant = async (phone?: string | null) => {
    if (!phone) {
      Alert.alert('暂无联系电话', '当前房间还没有可拨打的租客手机号。')
      return
    }

    const telUrl = `tel:${phone}`
    const canOpen = await Linking.canOpenURL(telUrl)
    if (!canOpen) {
      Alert.alert('无法拨打', '当前设备不支持拨打电话。')
      return
    }

    await Linking.openURL(telUrl)
  }

  const handleSave = async (moveNext: boolean) => {
    if (!activeItem) return

    try {
      const nextRoomId = moveNext ? getNextPendingRoomId(activeItem.roomId) : null
      await saveMutation.mutateAsync(activeItem)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['utilities', currentYear, currentMonth] }),
        queryClient.invalidateQueries({
          queryKey: ['utilities', 'export', currentYear, currentMonth],
        }),
      ])

      if (nextRoomId) {
        setActiveRoomId(nextRoomId)
        Alert.alert('保存成功', '已保存当前读数，并切换到下一间房。')
        return
      }

      Alert.alert('保存成功', moveNext ? '本次待抄表房间已处理完成。' : '读数已保存。')
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存失败，请稍后重试'
      Alert.alert('保存失败', message)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View
        style={{
          backgroundColor: Colors.primary,
          paddingTop: 28,
          paddingBottom: 28,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 36,
          borderBottomRightRadius: 36,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: '900', color: 'white', letterSpacing: -0.5 }}>
          智能抄表
        </Text>
        <Text
          style={{
            marginTop: 6,
            fontSize: 12,
            color: 'rgba(255,255,255,0.78)',
            fontWeight: '500',
          }}
        >
          {currentYear}年{currentMonth}月现场录入
        </Text>

        <View
          style={{
            marginTop: 18,
            backgroundColor: 'rgba(255,255,255,0.16)',
            borderRadius: 18,
            paddingHorizontal: 16,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.14)',
          }}
        >
          <TextInput
            style={{
              color: 'white',
              paddingVertical: 12,
              fontSize: 14,
            }}
            placeholder="搜索公寓、房间号、租客"
            placeholderTextColor="rgba(255,255,255,0.72)"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <SummaryChip label="待抄表" value={pendingCount} tone="warning" />
          <SummaryChip label="已录入" value={enteredCount} tone="success" />
          <SummaryChip label="逾期" value={overdueCount} tone="danger" />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} colors={[Colors.primary]} />
        }
      >
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
          {([
            ['pending', '待抄表'],
            ['entered', '已录入'],
            ['all', '全部'],
          ] as const).map(([value, label]) => (
            <TouchableOpacity
              key={value}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderRadius: 999,
                backgroundColor: filter === value ? Colors.primary : 'white',
                borderWidth: filter === value ? 0 : 1,
                borderColor: Colors.border,
              }}
              onPress={() => setFilter(value)}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: filter === value ? 'white' : Colors.textSecondary,
                }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 6 }}
          style={{ marginBottom: 16 }}
        >
          <ApartmentFilterPill
            label="全部公寓"
            selected={selectedApartmentId === 'all'}
            onPress={() => setSelectedApartmentId('all')}
          />
          {apartments.map((apartment) => (
            <ApartmentFilterPill
              key={apartment.id}
              label={apartment.name}
              selected={selectedApartmentId === apartment.id}
              onPress={() => setSelectedApartmentId(apartment.id)}
            />
          ))}
        </ScrollView>

        {activeItem ? (
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 28,
              padding: 18,
              borderWidth: 1,
              borderColor: Colors.borderLight,
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.06,
              shadowRadius: 16,
              elevation: 4,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: Colors.textMuted, fontWeight: '600' }}>
                  {activeItem.apartmentName}
                </Text>
                <Text
                  style={{
                    marginTop: 4,
                    fontSize: 24,
                    fontWeight: '900',
                    color: Colors.textPrimary,
                    letterSpacing: -0.6,
                  }}
                >
                  {activeItem.roomNumber}
                </Text>
                <Text style={{ marginTop: 6, fontSize: 13, color: Colors.textSecondary }}>
                  {activeItem.tenantName || '未绑定租客'}
                </Text>
              </View>

              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 16,
                  backgroundColor: getStatusMeta(activeItem.status).bgColor,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '800',
                    color: getStatusMeta(activeItem.status).textColor,
                  }}
                >
                  {getStatusMeta(activeItem.status).label}
                </Text>
              </View>
            </View>

            <View
              style={{
                marginTop: 16,
                padding: 14,
                borderRadius: 18,
                backgroundColor: '#F8FAFC',
                borderWidth: 1,
                borderColor: Colors.borderLight,
              }}
            >
              <InfoRow label="出账日" value={`每月${activeItem.billingDay}日`} />
              <InfoRow label="租客电话" value={activeItem.tenantPhone || '暂无'} />
              <InfoRow label="抄表日期" value={readingDate} last />
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  borderRadius: 16,
                  paddingVertical: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#EFF6FF',
                }}
                onPress={() => handleOpenRoom(activeItem.roomId)}
              >
                <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.primary }}>
                  查看房间
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  borderRadius: 16,
                  paddingVertical: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: activeItem.tenantPhone ? '#ECFDF5' : '#F8FAFC',
                  borderWidth: 1,
                  borderColor: activeItem.tenantPhone ? '#BBF7D0' : Colors.borderLight,
                }}
                onPress={() => handleCallTenant(activeItem.tenantPhone)}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '800',
                    color: activeItem.tenantPhone ? Colors.success : Colors.textMuted,
                  }}
                >
                  联系租客
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 18, gap: 14 }}>
              <MeterInputCard
                title="水表读数"
                unit="m3"
                previous={activeItem.waterPrevious}
                price={activeItem.waterUnitPrice}
                value={waterInput}
                usage={waterUsage}
                fee={waterFee}
                onChange={setWaterInput}
              />

              <MeterInputCard
                title="电表读数"
                unit="kWh"
                previous={activeItem.electricityPrevious}
                price={activeItem.electricityUnitPrice}
                value={electricityInput}
                usage={electricityUsage}
                fee={electricityFee}
                onChange={setElectricityInput}
              />
            </View>

            <View style={{ marginTop: 16 }}>
              <Text style={{ fontSize: 12, color: Colors.textMuted, fontWeight: '600' }}>
                备注
              </Text>
              <TextInput
                style={{
                  marginTop: 8,
                  minHeight: 84,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  backgroundColor: '#FCFCFD',
                  fontSize: 14,
                  color: Colors.textPrimary,
                  textAlignVertical: 'top',
                }}
                multiline
                placeholder="可记录表盘照片编号、异常说明、入户备注"
                placeholderTextColor={Colors.textMuted}
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            <TouchableOpacity
              style={{
                marginTop: 12,
                borderRadius: 16,
                paddingVertical: 12,
                alignItems: 'center',
                backgroundColor: '#F8FAFC',
                borderWidth: 1,
                borderColor: Colors.borderLight,
              }}
              onPress={() =>
                Alert.alert('即将支持', '拍照凭证上传需要接入图片选择/相机能力，当前版本先支持读数和备注录入。')
              }
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textSecondary }}>
                照片凭证
              </Text>
              <Text style={{ marginTop: 2, fontSize: 11, color: Colors.textMuted }}>
                现场拍照上传入口预留中
              </Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#EFF6FF',
                }}
                disabled={saveMutation.isPending}
                onPress={() => handleSave(false)}
              >
                {saveMutation.isPending ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.primary }}>
                    保存
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1.3,
                  paddingVertical: 14,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: Colors.primary,
                }}
                disabled={saveMutation.isPending}
                onPress={() => handleSave(true)}
              >
                {saveMutation.isPending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ fontSize: 14, fontWeight: '800', color: 'white' }}>
                    保存并下一间
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <EmptyState
            icon="💧"
            title="当前筛选下没有待处理房间"
            description="切换筛选条件或下拉刷新，查看本月抄表任务。"
          />
        )}

        <View style={{ marginTop: 22 }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: Colors.textPrimary }}>
            房间队列
          </Text>
          <Text style={{ marginTop: 4, fontSize: 12, color: Colors.textMuted }}>
            红点表示待抄表房间，点击任意房间切换录入。
          </Text>
        </View>

        {isLoading ? (
          <View style={{ paddingVertical: 36, alignItems: 'center' }}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={{ marginTop: 10, fontSize: 12, color: Colors.textMuted }}>加载中...</Text>
          </View>
        ) : filteredItems.length > 0 ? (
          <View style={{ marginTop: 14, gap: 12 }}>
            {filteredItems.map((item) => (
              <QueueCard
                key={`${item.roomId}-${item.readingId ?? 'pending'}`}
                item={item}
                selected={item.roomId === activeItem?.roomId}
                onPress={() => setActiveRoomId(item.roomId)}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon="📭"
            title="没有匹配的房间"
            description="可以试试更换公寓筛选或搜索关键字。"
          />
        )}
      </ScrollView>
    </View>
  )
}

function SummaryChip({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'warning' | 'success' | 'danger'
}) {
  const toneMap = {
    warning: { bg: 'rgba(255,255,255,0.16)', valueColor: 'white', labelColor: 'rgba(255,255,255,0.72)' },
    success: { bg: 'rgba(255,255,255,0.16)', valueColor: 'white', labelColor: 'rgba(255,255,255,0.72)' },
    danger: { bg: 'rgba(255,255,255,0.16)', valueColor: 'white', labelColor: 'rgba(255,255,255,0.72)' },
  } as const

  return (
    <View
      style={{
        flex: 1,
        borderRadius: 18,
        backgroundColor: toneMap[tone].bg,
        paddingVertical: 12,
        paddingHorizontal: 14,
      }}
    >
      <Text style={{ fontSize: 22, fontWeight: '900', color: toneMap[tone].valueColor }}>{value}</Text>
      <Text style={{ marginTop: 3, fontSize: 11, color: toneMap[tone].labelColor }}>{label}</Text>
    </View>
  )
}

function ApartmentFilterPill({
  label,
  selected,
  onPress,
}: {
  label: string
  selected: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      style={{
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 999,
        backgroundColor: selected ? '#DBEAFE' : 'white',
        borderWidth: 1,
        borderColor: selected ? '#BFDBFE' : Colors.borderLight,
      }}
      onPress={onPress}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: '700',
          color: selected ? Colors.primary : Colors.textSecondary,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  )
}

function QueueCard({
  item,
  selected,
  onPress,
}: {
  item: QueueItem
  selected: boolean
  onPress: () => void
}) {
  const meta = getStatusMeta(item.status)

  return (
    <TouchableOpacity
      style={{
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 16,
        borderWidth: 1.5,
        borderColor: selected ? '#BFDBFE' : Colors.borderLight,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: selected ? 0.08 : 0.03,
        shadowRadius: 6,
        elevation: selected ? 3 : 1,
      }}
      onPress={onPress}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: meta.bgColor,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 18 }}>{meta.icon}</Text>
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.textPrimary }}>
                {item.roomNumber}
              </Text>
              {item.status !== 'entered' ? (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    backgroundColor: Colors.danger,
                    marginLeft: 8,
                  }}
                />
              ) : null}
            </View>
            <Text style={{ marginTop: 2, fontSize: 11, color: Colors.textMuted }}>
              {item.apartmentName}
            </Text>
            <Text style={{ marginTop: 4, fontSize: 12, color: Colors.textSecondary }}>
              {item.tenantName || '未绑定租客'}
            </Text>
          </View>
        </View>

        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 12,
            backgroundColor: meta.bgColor,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '800', color: meta.textColor }}>
            {meta.label}
          </Text>
        </View>
      </View>

      <View
        style={{
          marginTop: 14,
          paddingTop: 14,
          borderTopWidth: 1,
          borderTopColor: Colors.borderLight,
          flexDirection: 'row',
        }}
      >
        <QueueMetric
          label="上次水表"
          value={formatReading(item.waterPrevious)}
          suffix="m3"
        />
        <QueueMetric
          label="上次电表"
          value={formatReading(item.electricityPrevious)}
          suffix="kWh"
        />
        <QueueMetric
          label="出账日"
          value={`${item.billingDay}`}
          suffix="日"
        />
      </View>
    </TouchableOpacity>
  )
}

function QueueMetric({
  label,
  value,
  suffix,
}: {
  label: string
  value: string
  suffix: string
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 11, color: Colors.textMuted }}>{label}</Text>
      <Text style={{ marginTop: 4, fontSize: 13, fontWeight: '700', color: Colors.textPrimary }}>
        {value}
        <Text style={{ fontSize: 11, color: Colors.textMuted }}> {suffix}</Text>
      </Text>
    </View>
  )
}

function MeterInputCard({
  title,
  unit,
  previous,
  price,
  value,
  usage,
  fee,
  onChange,
}: {
  title: string
  unit: string
  previous: number | null
  price: number | null
  value: string
  usage: number | null
  fee: number | null
  onChange: (value: string) => void
}) {
  return (
    <View
      style={{
        backgroundColor: '#F8FAFC',
        borderRadius: 22,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.borderLight,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.textPrimary }}>{title}</Text>
        <Text style={{ fontSize: 11, color: Colors.textMuted }}>
          上次读数 {formatReading(previous)} {unit}
        </Text>
      </View>

      <View
        style={{
          marginTop: 12,
          borderRadius: 20,
          backgroundColor: 'white',
          borderWidth: 1,
          borderColor: Colors.border,
          paddingHorizontal: 18,
          paddingVertical: 14,
        }}
      >
        <Text style={{ fontSize: 11, color: Colors.textMuted }}>当前读数</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
          <TextInput
            style={{
              flex: 1,
              fontSize: 36,
              fontWeight: '900',
              color: Colors.textPrimary,
              paddingVertical: 0,
            }}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor="#CBD5E1"
            value={value}
            onChangeText={(nextValue) => onChange(sanitizeNumericInput(nextValue))}
          />
          <Text style={{ marginLeft: 8, fontSize: 14, fontWeight: '700', color: Colors.textMuted }}>
            {unit}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', marginTop: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: Colors.textMuted }}>本次用量</Text>
          <Text style={{ marginTop: 4, fontSize: 16, fontWeight: '800', color: Colors.textPrimary }}>
            {usage != null ? usage.toFixed(2) : '--'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: Colors.textMuted }}>单价</Text>
          <Text style={{ marginTop: 4, fontSize: 16, fontWeight: '800', color: Colors.textPrimary }}>
            {price != null ? `¥${price.toFixed(2)}` : '--'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: Colors.textMuted }}>费用</Text>
          <Text style={{ marginTop: 4, fontSize: 16, fontWeight: '800', color: Colors.primary }}>
            {fee != null ? `¥${formatMoney(fee)}` : '--'}
          </Text>
        </View>
      </View>
    </View>
  )
}

function InfoRow({
  label,
  value,
  last,
}: {
  label: string
  value: string
  last?: boolean
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingBottom: last ? 0 : 10,
        marginBottom: last ? 0 : 10,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: Colors.borderLight,
      }}
    >
      <Text style={{ fontSize: 12, color: Colors.textMuted }}>{label}</Text>
      <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.textPrimary }}>{value}</Text>
    </View>
  )
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 36 }}>
      <Text style={{ fontSize: 42 }}>{icon}</Text>
      <Text
        style={{
          marginTop: 12,
          fontSize: 16,
          fontWeight: '800',
          color: Colors.textPrimary,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          marginTop: 6,
          fontSize: 12,
          lineHeight: 18,
          color: Colors.textMuted,
          textAlign: 'center',
        }}
      >
        {description}
      </Text>
    </View>
  )
}
