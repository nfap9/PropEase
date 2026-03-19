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
import {
  MeterInputCard,
  InfoRow,
  EmptyState,
  QueueCard,
  FilterTabs,
  ApartmentFilterPill,
  SummaryChip,
} from '@/components/utilities'

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

export type QueueItem = {
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

function parseDecimal(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
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
      {/* Page Header */}
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

        {/* Search */}
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

        {/* Summary chips */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <SummaryChip label="待抄表" value={pendingCount} tone="warning" />
          <SummaryChip label="已录入" value={enteredCount} tone="success" />
          <SummaryChip label="逾期" value={overdueCount} tone="danger" />
        </View>
      </View>

      {/* Scroll content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} colors={[Colors.primary]} />
        }
      >
        {/* Filter tabs */}
        <FilterTabs filter={filter} onFilterChange={setFilter} />

        {/* Apartment filter pills */}
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

        {/* Active item detail card */}
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
            {/* Room header */}
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

              <StatusBadge status={activeItem.status} />
            </View>

            {/* Info rows */}
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

            {/* Action buttons */}
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

            {/* Meter inputs */}
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

            {/* Notes */}
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

            {/* Photo placeholder */}
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

            {/* Save buttons */}
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

        {/* Queue section */}
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

function StatusBadge({ status }: { status: QueueStatus }) {
  const meta = {
    overdue: { label: '已逾期', textColor: Colors.danger, bgColor: '#FEF2F2' },
    upcoming: { label: '即将抄表', textColor: Colors.warning, bgColor: '#FFF7ED' },
    entered: { label: '已录入', textColor: Colors.success, bgColor: '#ECFDF5' },
    pending: { label: '待抄表', textColor: Colors.primary, bgColor: '#EFF6FF' },
  }[status]

  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: meta.bgColor,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: '800', color: meta.textColor }}>
        {meta.label}
      </Text>
    </View>
  )
}
