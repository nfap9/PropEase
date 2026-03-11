import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { Colors } from '@/constants'
import { useState } from 'react'

type NotificationType = 'all' | 'bill' | 'lease' | 'system'

interface Notification {
  id: string
  type: 'bill' | 'lease' | 'repair' | 'payment' | 'contract' | 'system' | 'overdue'
  title: string
  content: string
  time: string
  read: boolean
  tag: string
  tagColor: string
  icon: string
  iconBgColor: string
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'bill',
    title: '账单已生成',
    content: '阳光公寓A栋101室 2月账单已生成，金额¥2500，请及时查看并支付。',
    time: '10:30',
    read: false,
    tag: '账单提醒',
    tagColor: Colors.primary,
    icon: '📄',
    iconBgColor: '#EFF6FF',
  },
  {
    id: '2',
    type: 'lease',
    title: '租约即将到期',
    content: '租客李四的租约将于7天后（3月17日）到期，请及时联系续租。',
    time: '昨天',
    read: false,
    tag: '租约提醒',
    tagColor: Colors.warning,
    icon: '📝',
    iconBgColor: '#FFF7ED',
  },
  {
    id: '3',
    type: 'repair',
    title: '房间报修提醒',
    content: '阳光公寓A栋103室报修申请：水龙头漏水，请尽快安排维修。',
    time: '昨天',
    read: true,
    tag: '维修提醒',
    tagColor: '#CA8A04',
    icon: '🔧',
    iconBgColor: '#FEF9C3',
  },
  {
    id: '4',
    type: 'payment',
    title: '账单已支付',
    content: '租客张三已支付2月账单¥2500，支付方式：微信支付。',
    time: '2月28日',
    read: true,
    tag: '支付通知',
    tagColor: Colors.success,
    icon: '💰',
    iconBgColor: '#ECFDF5',
  },
  {
    id: '5',
    type: 'contract',
    title: '新租约已签订',
    content: '租客王五与阳光公寓A栋301室签订一年租约，租期2024-06-01至2025-06-01。',
    time: '2月25日',
    read: true,
    tag: '租约通知',
    tagColor: '#9333EA',
    icon: '📝',
    iconBgColor: '#F3E8FF',
  },
  {
    id: '6',
    type: 'system',
    title: '系统更新通知',
    content: '公寓管理系统已更新至V2.1.0版本，新增账单批量生成功能，优化了房间管理界面。',
    time: '2月20日',
    read: true,
    tag: '系统通知',
    tagColor: '#6B7280',
    icon: 'ℹ️',
    iconBgColor: '#F3F4F6',
  },
  {
    id: '7',
    type: 'overdue',
    title: '账单逾期提醒',
    content: '租客赵六的1月账单已逾期15天，请及时催缴。',
    time: '2月15日',
    read: true,
    tag: '逾期提醒',
    tagColor: Colors.danger,
    icon: '⚠️',
    iconBgColor: '#FEF2F2',
  },
]

export default function NotificationsScreen() {
  const [filter, setFilter] = useState<NotificationType>('all')

  const { data: notifications, isLoading, refetch } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: async () => {
      // TODO: 实际 API 调用
      if (filter === 'all') return mockNotifications
      if (filter === 'bill') return mockNotifications.filter(n => n.type === 'bill' || n.type === 'payment' || n.type === 'overdue')
      if (filter === 'lease') return mockNotifications.filter(n => n.type === 'lease' || n.type === 'contract')
      return mockNotifications.filter(n => n.type === 'system')
    },
  })

  const unreadCount = notifications?.filter(n => !n.read).length || 0

  const filterButtons: { key: NotificationType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'bill', label: '账单' },
    { key: 'lease', label: '租约' },
    { key: 'system', label: '系统' },
  ]

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* 顶部 */}
      <View
        style={{
          backgroundColor: Colors.primary,
          paddingTop: 24,
          paddingBottom: 24,
          paddingHorizontal: 20,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: 'white' }}>
            消息中心
          </Text>
          <TouchableOpacity>
            <Text style={{ fontSize: 14, fontWeight: '700', color: 'white' }}>全部已读</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab 切换 */}
      <View style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
        <View style={{ flexDirection: 'row', paddingHorizontal: 20 }}>
          {filterButtons.map((btn) => (
            <TouchableOpacity
              key={btn.key}
              style={{
                flex: 1,
                paddingVertical: 16,
                alignItems: 'center',
                borderBottomWidth: 2,
                borderBottomColor: filter === btn.key ? Colors.primary : 'transparent',
                position: 'relative',
              }}
              onPress={() => setFilter(btn.key)}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: filter === btn.key ? Colors.primary : Colors.textMuted,
                }}
              >
                {btn.label}
              </Text>
              {btn.key === 'all' && unreadCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 20,
                    width: 8,
                    height: 8,
                    backgroundColor: Colors.danger,
                    borderRadius: 4,
                  }}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[Colors.primary]} />
        }
      >
        {notifications && notifications.length > 0 ? (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={{
                backgroundColor: 'white',
                borderRadius: 20,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#F3F4F6',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.03,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <View style={{ flexDirection: 'row' }}>
                {/* 图标 */}
                <View
                  style={{
                    width: 44,
                    height: 44,
                    backgroundColor: notification.iconBgColor,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 18 }}>{notification.icon}</Text>
                </View>

                {/* 内容 */}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary }}>
                        {notification.title}
                      </Text>
                      {!notification.read && (
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            backgroundColor: Colors.danger,
                            borderRadius: 4,
                            marginLeft: 8,
                          }}
                        />
                      )}
                    </View>
                    <Text style={{ fontSize: 10, color: Colors.textMuted }}>{notification.time}</Text>
                  </View>

                  <Text style={{ fontSize: 11, color: Colors.textSecondary, lineHeight: 16, marginBottom: 8 }}>
                    {notification.content}
                  </Text>

                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      backgroundColor: notification.iconBgColor,
                      borderRadius: 4,
                      alignSelf: 'flex-start',
                    }}
                  >
                    <Text style={{ fontSize: 9, fontWeight: '700', color: notification.tagColor }}>
                      {notification.tag}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>📭</Text>
            <Text style={{ color: Colors.textMuted, fontWeight: '600' }}>暂无消息</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
