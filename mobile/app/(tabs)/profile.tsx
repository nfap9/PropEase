import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { useAuth } from '@/hooks'
import { Colors } from '@/constants'
import { useRouter } from 'expo-router'

interface MenuItem {
  icon: string
  label: string
  color: string
  route?: string
}

export default function ProfileScreen() {
  const { user, organization, logout } = useAuth()
  const router = useRouter()

  const teamMenuItems: MenuItem[] = [
    { icon: '👥', label: '团队成员管理', color: '#EFF6FF', route: '/settings/team' },
    { icon: '🔐', label: '角色与权限配置', color: '#F3E8FF', route: '/settings/roles' },
  ]

  const financeMenuItems: MenuItem[] = [
    { icon: '💳', label: '收款账户管理', color: '#ECFDF5', route: '/settings/accounts' },
    { icon: '📄', label: '收据模板配置', color: '#FFF7ED', route: '/settings/receipts' },
  ]

  const systemMenuItems: MenuItem[] = [
    { icon: '⚙️', label: '费用配置', color: '#FFF7ED', route: '/settings/fee-configs' },
    { icon: '📊', label: '经营报表', color: '#EEF2FF', route: '/settings/reports' },
    { icon: '🔔', label: '消息通知', color: '#FEF2F2', route: '/settings/notifications' },
    { icon: '🔒', label: '账号与安全', color: '#F3F4F6', route: '/settings/security' },
    { icon: '❓', label: '帮助与反馈', color: '#F3F4F6', route: '/settings/help' },
  ]

  const handleMenuPress = (route?: string) => {
    if (route) {
      router.push(route as any)
    }
  }

  const renderMenuItem = (item: MenuItem, index: number) => (
    <TouchableOpacity
      key={index}
      style={{
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        marginBottom: 12,
      }}
      onPress={() => handleMenuPress(item.route)}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 40,
            height: 40,
            backgroundColor: item.color,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 18 }}>{item.icon}</Text>
        </View>
        <Text style={{ marginLeft: 12, fontSize: 14, fontWeight: '700', color: Colors.textPrimary }}>
          {item.label}
        </Text>
      </View>
      <Text style={{ color: '#D1D5DB', fontSize: 16 }}>›</Text>
    </TouchableOpacity>
  )

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* 用户信息卡片 */}
        <View
          style={{
            margin: 20,
            marginBottom: 8,
            backgroundColor: Colors.primary,
            borderRadius: 32,
            padding: 24,
            shadowColor: Colors.primary,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 64,
                height: 64,
                backgroundColor: 'white',
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 32 }}>👤</Text>
            </View>
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: 'white' }}>
                {user?.full_name || '管理员'}
              </Text>
              <View
                style={{
                  marginTop: 4,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: 12,
                  alignSelf: 'flex-start',
                }}
              >
                <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '700' }}>
                  组织所有者
                </Text>
              </View>
            </View>
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: 'rgba(255,255,255,0.1)',
              marginTop: 16,
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: 'white' }}>128</Text>
              <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '500' }}>管理房源</Text>
            </View>
            <View
              style={{
                width: 1,
                backgroundColor: 'rgba(255,255,255,0.1)',
              }}
            />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: 'white' }}>4</Text>
              <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '500' }}>团队成员</Text>
            </View>
            <View
              style={{
                width: 1,
                backgroundColor: 'rgba(255,255,255,0.1)',
              }}
            />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: '900', color: '#34D399' }}>活跃</Text>
              <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '500' }}>组织状态</Text>
            </View>
          </View>
        </View>

        {/* 功能菜单 */}
        <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
          {/* 团队管理 */}
          <Text
            style={{
              fontSize: 10,
              color: Colors.textMuted,
              fontWeight: '700',
              letterSpacing: 1,
              marginBottom: 12,
              paddingHorizontal: 8,
            }}
          >
            团队管理
          </Text>
          <View style={{ marginBottom: 16 }}>
            {teamMenuItems.map(renderMenuItem)}
          </View>

          {/* 财务管理 */}
          <Text
            style={{
              fontSize: 10,
              color: Colors.textMuted,
              fontWeight: '700',
              letterSpacing: 1,
              marginBottom: 12,
              paddingHorizontal: 8,
              marginTop: 8,
            }}
          >
            财务管理
          </Text>
          <View style={{ marginBottom: 16 }}>
            {financeMenuItems.map(renderMenuItem)}
          </View>

          {/* 系统设置 */}
          <Text
            style={{
              fontSize: 10,
              color: Colors.textMuted,
              fontWeight: '700',
              letterSpacing: 1,
              marginBottom: 12,
              paddingHorizontal: 8,
              marginTop: 8,
            }}
          >
            系统设置
          </Text>
          <View>
            {systemMenuItems.map(renderMenuItem)}
          </View>

          {/* 组织信息 */}
          <View
            style={{
              marginTop: 24,
              backgroundColor: 'white',
              borderRadius: 24,
              padding: 20,
              borderWidth: 1,
              borderColor: '#F3F4F6',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: Colors.textMuted, fontWeight: '700' }}>目前组织</Text>
              <Text style={{ fontSize: 14, color: Colors.textPrimary, fontWeight: '900' }}>
                {organization?.name || '未选择'}
              </Text>
            </View>
            <View
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: '#F3F4F6',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 12, color: Colors.textMuted, fontWeight: '700' }}>创建时间</Text>
              <Text style={{ fontSize: 14, color: Colors.textPrimary, fontWeight: '900' }}>
                {organization?.created_at
                  ? new Date(organization.created_at).toLocaleDateString()
                  : '-'}
              </Text>
            </View>
          </View>

          {/* 退出登录 */}
          <TouchableOpacity
            style={{
              marginTop: 24,
              backgroundColor: '#FEF2F2',
              borderRadius: 24,
              padding: 16,
              alignItems: 'center',
            }}
            onPress={logout}
          >
            <Text style={{ color: Colors.danger, fontWeight: '700' }}>退出当前登录</Text>
          </TouchableOpacity>

          {/* 版本信息 */}
          <View style={{ alignItems: 'center', paddingVertical: 32 }}>
            <Text style={{ fontSize: 10, color: Colors.textMuted, fontWeight: '700', textAlign: 'center' }}>
              寓管家 Pro v1.0.0
            </Text>
            <Text style={{ fontSize: 10, color: Colors.textMuted, marginTop: 4, textAlign: 'center' }}>
              © 2026 SpaceFlow Tech. All Rights Reserved.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
